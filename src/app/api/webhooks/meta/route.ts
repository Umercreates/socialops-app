import { createHmac, timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"
import { findSocialAccountByExternalId } from "@/lib/platform/social-accounts"
import { ingestComment } from "@/lib/platform/comments"
import { recordWebhookEvent, markWebhookEventProcessed, markWebhookEventFailed } from "@/lib/integrations/webhook-events"

/**
 * Combined Meta webhook for Facebook Page comments (`object: "page"`,
 * `field: "feed"`) and Instagram comments (`object: "instagram"`,
 * `field: "comments"`) - one callback URL registered once in the Meta App
 * Dashboard for EasyLife's own platform app, covering every workspace.
 *
 * Unlike WhatsApp (where each workspace brings its own Meta App/secret),
 * Facebook/Instagram publishing uses EasyLife's single platform app (see
 * META_PLATFORM_CLIENT_ID/SECRET in providers.ts) - so there is exactly one
 * app secret and one verify token for this whole webhook, not a per-
 * workspace lookup. The workspace a delivery belongs to is resolved from
 * the Page/IG Business Account id already stored on that workspace's
 * social_accounts row (see findSocialAccountByExternalId), only AFTER the
 * request's signature has been verified against the platform app secret.
 */

export async function GET(request: Request) {
  const url = new URL(request.url)
  const mode = url.searchParams.get("hub.mode")
  const token = url.searchParams.get("hub.verify_token")
  const challenge = url.searchParams.get("hub.challenge")

  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN
  if (mode !== "subscribe" || !token || !challenge || !verifyToken || token !== verifyToken) {
    return NextResponse.json({ error: "Verification failed" }, { status: 403 })
  }

  return new NextResponse(challenge, { status: 200, headers: { "Content-Type": "text/plain" } })
}

interface FacebookFeedValue {
  item?: string
  verb?: string
  comment_id?: string
  post_id?: string
  message?: string
  from?: { id?: string; name?: string }
}

interface InstagramCommentsValue {
  id?: string
  text?: string
  from?: { id?: string; username?: string }
  media?: { id?: string }
}

interface MetaWebhookEntry {
  id?: string
  changes?: { field?: string; value?: unknown }[]
}

interface MetaWebhookBody {
  object?: string
  entry?: MetaWebhookEntry[]
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const appSecret = process.env.META_PLATFORM_CLIENT_SECRET
  if (!appSecret) {
    return NextResponse.json({ error: "Not configured" }, { status: 404 })
  }

  const signatureHeader = request.headers.get("x-hub-signature-256")
  if (!signatureHeader?.startsWith("sha256=")) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 })
  }
  const expectedSignature = createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex")
  const providedSignature = signatureHeader.slice("sha256=".length)
  const expectedBuf = Buffer.from(expectedSignature, "hex")
  const providedBuf = Buffer.from(providedSignature, "hex")
  const signatureValid = expectedBuf.length === providedBuf.length && timingSafeEqual(expectedBuf, providedBuf)
  if (!signatureValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let parsed: MetaWebhookBody
  try {
    parsed = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  for (const entry of parsed.entry ?? []) {
    const ownerId = entry.id
    if (!ownerId) continue

    for (const change of entry.changes ?? []) {
      if (parsed.object === "page" && change.field === "feed") {
        await handleFacebookFeedChange(ownerId, change.value as FacebookFeedValue)
      } else if (parsed.object === "instagram" && change.field === "comments") {
        await handleInstagramCommentChange(ownerId, change.value as InstagramCommentsValue)
      }
    }
  }

  return NextResponse.json({ ok: true })
}

async function handleFacebookFeedChange(pageId: string, value: FacebookFeedValue): Promise<void> {
  if (value.item !== "comment" || value.verb !== "add" || !value.comment_id) return
  // Our own reply lands as another "feed" comment event - never re-ingest
  // it as a new inbound comment from a customer.
  if (value.from?.id === pageId) return

  const account = await findSocialAccountByExternalId("facebook", pageId)
  if (!account) return

  const event = await recordWebhookEvent({
    provider: "facebook",
    workspaceId: account.workspaceId,
    externalEventId: value.comment_id,
    eventType: "comment",
    payloadSummary: { postId: value.post_id },
  })
  if (!event) return

  try {
    await ingestComment({
      workspaceId: account.workspaceId,
      socialAccountId: account.socialAccountId,
      provider: "facebook",
      externalPostId: value.post_id ?? null,
      externalCommentId: value.comment_id,
      authorName: value.from?.name ?? "Facebook user",
      body: value.message ?? "",
    })
    await markWebhookEventProcessed(event.id)
  } catch (error) {
    console.error("Facebook comment ingestion failed:", error instanceof Error ? error.message : error)
    await markWebhookEventFailed(event.id, "processing_error")
  }
}

async function handleInstagramCommentChange(igUserId: string, value: InstagramCommentsValue): Promise<void> {
  if (!value.id || value.from?.id === igUserId) return

  const account = await findSocialAccountByExternalId("instagram", igUserId)
  if (!account) return

  const event = await recordWebhookEvent({
    provider: "instagram",
    workspaceId: account.workspaceId,
    externalEventId: value.id,
    eventType: "comment",
    payloadSummary: { mediaId: value.media?.id },
  })
  if (!event) return

  try {
    await ingestComment({
      workspaceId: account.workspaceId,
      socialAccountId: account.socialAccountId,
      provider: "instagram",
      externalPostId: value.media?.id ?? null,
      externalCommentId: value.id,
      authorName: value.from?.username ?? "Instagram user",
      authorHandle: value.from?.username ?? null,
      body: value.text ?? "",
    })
    await markWebhookEventProcessed(event.id)
  } catch (error) {
    console.error("Instagram comment ingestion failed:", error instanceof Error ? error.message : error)
    await markWebhookEventFailed(event.id, "processing_error")
  }
}
