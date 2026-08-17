/**
 * Official Meta Graph API client for Instagram professional account
 * publishing. Same graph.facebook.com host and never-throw contract as
 * the Facebook Page client. Unlike Facebook Pages, Instagram's Content
 * Publishing API has no direct file-upload option - it only accepts a
 * publicly fetchable image_url/video_url that Meta's own servers fetch,
 * which is why publishing here needs a signed public media URL (see
 * src/lib/storage/public-url.ts) instead of reading bytes locally.
 */
const GRAPH_API_VERSION = "v21.0"
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`

export interface LinkedInstagramAccountResult {
  ok: boolean
  igUserId?: string
  error?: string
}

/** GET /{page-id}?fields=instagram_business_account - an Instagram
 * professional account is always linked through a Facebook Page, so this
 * is how a workspace's already-selected Facebook Page resolves to the
 * Instagram account it can publish to, without a separate Instagram
 * account-picker. No Instagram account linked to the Page reads as a
 * clean, honest "not found" rather than an error. */
export async function getLinkedInstagramAccount(pageId: string, pageAccessToken: string): Promise<LinkedInstagramAccountResult> {
  try {
    const url = new URL(`${GRAPH_API_BASE}/${pageId}`)
    url.searchParams.set("fields", "instagram_business_account")

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${pageAccessToken}` },
      signal: AbortSignal.timeout(15000),
    })
    const json = await res.json().catch(() => null)

    if (res.status === 401) return { ok: false, error: "Facebook access token is invalid or expired - reconnect Facebook." }
    if (!res.ok) return { ok: false, error: json?.error?.message ?? `Facebook API returned ${res.status}` }

    const igUserId = json?.instagram_business_account?.id as string | undefined
    if (!igUserId) return { ok: false, error: "This Facebook Page has no linked Instagram professional account." }
    return { ok: true, igUserId }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Couldn't reach the Facebook API." }
  }
}

export interface PublishImageResult {
  ok: boolean
  externalPostId?: string
  errorMessage?: string
}

/** Two-step publish for a single image: create a media container from a
 * publicly fetchable image URL, then publish it. Image containers are
 * ready immediately (no status polling needed) - that's specific to
 * images; video containers process asynchronously and need polling this
 * app doesn't implement yet, so video publishing to Instagram stays
 * honestly unsupported for now rather than half-built. */
export async function publishInstagramImage(igUserId: string, accessToken: string, imageUrl: string, caption: string): Promise<PublishImageResult> {
  try {
    const createUrl = new URL(`${GRAPH_API_BASE}/${igUserId}/media`)
    createUrl.searchParams.set("image_url", imageUrl)
    if (caption) createUrl.searchParams.set("caption", caption)

    const createRes = await fetch(createUrl.toString(), {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(30000),
    })
    const createJson = await createRes.json().catch(() => null)
    if (!createRes.ok) {
      return { ok: false, errorMessage: createJson?.error?.message ?? `Instagram container creation failed (${createRes.status})` }
    }
    const creationId = createJson?.id as string | undefined
    if (!creationId) return { ok: false, errorMessage: "Instagram didn't return a container id." }

    const publishUrl = new URL(`${GRAPH_API_BASE}/${igUserId}/media_publish`)
    publishUrl.searchParams.set("creation_id", creationId)

    const publishRes = await fetch(publishUrl.toString(), {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(30000),
    })
    const publishJson = await publishRes.json().catch(() => null)
    if (!publishRes.ok) {
      return { ok: false, errorMessage: publishJson?.error?.message ?? `Instagram publish failed (${publishRes.status})` }
    }

    return { ok: true, externalPostId: publishJson?.id as string | undefined }
  } catch (error) {
    return { ok: false, errorMessage: error instanceof Error ? error.message : "Unknown Instagram publish error" }
  }
}
