import type { JobType, ClaimedJob } from "./queue"
import { isProviderId } from "@/lib/integrations/providers"
import { getConnection } from "@/lib/integrations/repository"
import { resolveCredentialValue, storeOAuthTokens } from "@/lib/integrations/service"
import { refreshAccessToken } from "@/lib/integrations/oauth"
import { resolveActiveConnection } from "@/lib/integrations/credential-resolution"
import { dispatchCall } from "@/lib/integrations/omnidimension/client"
import { publishTextPost, publishImagePost, publishVideoPost } from "@/lib/integrations/facebook/client"
import { getCall, markCallDispatched, markCallFailed } from "@/lib/platform/calls"
import { getPost, getPostTarget, markPostTargetResult, recomputePostStatus, type PostTargetRow } from "@/lib/platform/posts"
import { getMediaAsset } from "@/lib/platform/media"
import { getStorageAdapter } from "@/lib/storage/local-adapter"

/**
 * One handler per job type. Every handler that would touch a real external
 * provider checks the provider's connection status first and fails with a
 * clear, safe reason if it isn't genuinely connected - this queue never
 * silently pretends an external action happened. Handlers for capabilities
 * this phase doesn't implement yet (publishing, analytics sync, comment
 * sync) are intentionally thin: they validate inputs and report a clear
 * "not yet implemented" outcome rather than faking success.
 */

export type JobHandler = (job: ClaimedJob) => Promise<void>

async function refreshTokenHandler(job: ClaimedJob): Promise<void> {
  const provider = job.payload.provider as string
  if (!isProviderId(provider)) throw new Error(`Unknown provider: ${provider}`)

  const row = await getConnection(job.workspaceId, provider)
  const { value: refreshToken } = resolveCredentialValue(row, "refreshToken", provider)
  const { value: clientId } = resolveCredentialValue(row, "clientId", provider)
  const { value: clientSecret } = resolveCredentialValue(row, "clientSecret", provider)
  if (!refreshToken || !clientId || !clientSecret) {
    throw new Error(`${provider} is not connected via OAuth - nothing to refresh`)
  }

  const result = await refreshAccessToken(provider, refreshToken, clientId, clientSecret)
  if (!result.ok || !result.accessToken) {
    throw new Error(result.error ?? "Token refresh failed")
  }

  await storeOAuthTokens({
    workspaceId: job.workspaceId,
    provider,
    actorUserId: null,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    expiresInSeconds: result.expiresInSeconds,
  })
}

/** Dispatches a queued call via the workspace's live OmniDimension
 * connection. The call row already carries the number to dial (captured at
 * queue time from the lead) - this handler's only job is: confirm the
 * provider is genuinely live, resolve its credentials, place the call, and
 * record the provider's own call id so the post-call webhook can find this
 * row again later. On failure it records the error for visibility but only
 * flips the row to a terminal "failed" state once the job queue's own
 * retries are exhausted - a transient failure gets retried by the queue
 * without prematurely telling anyone the call failed for good. */
async function dispatchCallHandler(job: ClaimedJob): Promise<void> {
  const callId = job.payload.callId as string
  if (!callId) throw new Error("dispatch_call job is missing callId")

  const call = await getCall(job.workspaceId, callId)
  if (!call) throw new Error(`Call ${callId} not found in this workspace`)
  const toNumber = job.payload.toNumber as string
  if (!toNumber) throw new Error("dispatch_call job is missing toNumber")

  try {
    const { live, row } = await resolveActiveConnection(job.workspaceId, "omnidimension")
    if (!live) {
      throw new Error("OmniDimension is not activated (live) for this workspace - nothing to dispatch")
    }

    const { value: apiKey } = resolveCredentialValue(row, "apiKey", "omnidimension")
    const { value: agentId } = resolveCredentialValue(row, "agentId", "omnidimension")
    const { value: fromNumberId } = resolveCredentialValue(row, "fromNumberId", "omnidimension")
    if (!apiKey || !agentId) {
      throw new Error("OmniDimension API key or Agent ID is missing")
    }

    const result = await dispatchCall({ apiKey, agentId, toNumber, fromNumberId })
    if (!result.ok || !result.providerCallId) {
      throw new Error(result.error ?? "OmniDimension call dispatch failed")
    }

    await markCallDispatched(callId, result.providerCallId)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown call dispatch error"
    const isFinalAttempt = job.attempts >= job.maxAttempts
    if (isFinalAttempt) await markCallFailed(callId, message)
    throw error
  }
}

/** Facebook is the one provider with a real publish adapter so far: text,
 * a single image, or a single video, all genuinely posted through the
 * Graph API. Multiple attached media (a carousel/album post) isn't
 * implemented - Meta's multi-photo flow needs uploading each photo
 * unpublished first and attaching all of them to one /feed post, a
 * different shape from the single-asset endpoints used here - so that
 * case is honestly blocked rather than silently publishing only the
 * first attachment. */
async function publishToFacebook(
  target: PostTargetRow,
  row: Awaited<ReturnType<typeof resolveActiveConnection>>["row"]
): Promise<{ status: "published" | "failed" | "blocked"; externalPostId?: string; errorMessage?: string }> {
  const post = await getPost(target.workspaceId, target.postId)
  if (!post) return { status: "failed", errorMessage: "Parent post no longer exists." }

  const variant = post.variants.find((v) => v.platform === "facebook" && v.enabled)
  const message = variant
    ? [variant.caption, variant.hashtags].filter(Boolean).join("\n\n")
    : [post.baseCaption, post.baseHashtags].filter(Boolean).join("\n\n")

  const pageId = row?.config?.pageId
  const { value: pageAccessToken } = resolveCredentialValue(row, "pageAccessToken", "facebook")
  if (typeof pageId !== "string" || !pageAccessToken) {
    return { status: "blocked", errorMessage: "No Facebook Page selected for this workspace - choose one in Integrations." }
  }

  if (post.media.length > 1) {
    return { status: "blocked", errorMessage: "Facebook publishing supports at most one attached image or video per post right now - remove the extra media to publish this target." }
  }

  if (post.media.length === 1) {
    const media = post.media[0]
    if (!media.mediaAssetId) {
      return { status: "blocked", errorMessage: "This post's attached media hasn't finished uploading - try publishing again in a moment." }
    }
    const asset = await getMediaAsset(target.workspaceId, media.mediaAssetId)
    if (!asset) return { status: "failed", errorMessage: "The attached media file no longer exists." }
    const buffer = await getStorageAdapter().read(asset.storageKey)
    if (!buffer) return { status: "failed", errorMessage: "The attached media file's content couldn't be read." }

    const result =
      asset.mediaType === "video"
        ? await publishVideoPost(pageId, pageAccessToken, buffer, asset.mimeType, message)
        : await publishImagePost(pageId, pageAccessToken, buffer, asset.mimeType, message)
    if (!result.ok) return { status: "failed", errorMessage: result.errorMessage ?? "Facebook publish failed" }
    return { status: "published", externalPostId: result.externalPostId }
  }

  if (!message.trim()) return { status: "failed", errorMessage: "This post has no caption to publish." }
  const result = await publishTextPost(pageId, pageAccessToken, message)
  if (!result.ok) return { status: "failed", errorMessage: result.errorMessage ?? "Facebook publish failed" }
  return { status: "published", externalPostId: result.externalPostId }
}

/** Resolves one post_target: never publishes without a genuinely live
 * workspace connection for that target's provider (recording an honest
 * "blocked" result and rolling the parent post's status up, exactly like
 * the queue never faking success elsewhere). Facebook text posts have a
 * real adapter (see publishToFacebook); every other provider still has no
 * publish adapter and reaches an honest "not yet implemented" result
 * rather than a fabricated success. */
async function publishPostHandler(job: ClaimedJob): Promise<void> {
  const targetId = job.payload.targetId as string
  if (!targetId) throw new Error("publish_post job is missing targetId")

  const target = await getPostTarget(targetId)
  if (!target) throw new Error(`Post target ${targetId} not found`)

  if (!isProviderId(target.provider)) throw new Error(`Unknown provider: ${target.provider}`)

  const { live, row } = await resolveActiveConnection(target.workspaceId, target.provider)
  if (!live) {
    await markPostTargetResult(targetId, {
      status: "blocked",
      errorMessage: `${target.provider} is not connected and activated for this workspace. Configure it in Integrations.`,
    })
    await recomputePostStatus(target.workspaceId, target.postId)
    return
  }

  const result =
    target.provider === "facebook"
      ? await publishToFacebook(target, row)
      : { status: "failed" as const, errorMessage: `Publishing to ${target.provider} is architecture-ready but has no publish adapter implemented yet.` }

  await markPostTargetResult(targetId, result)
  await recomputePostStatus(target.workspaceId, target.postId)
}

function notYetImplemented(capability: string): JobHandler {
  return async () => {
    throw new Error(`${capability} is architecture-ready but has no live provider connected yet`)
  }
}

export const JOB_HANDLERS: Record<JobType, JobHandler> = {
  refresh_token: refreshTokenHandler,
  dispatch_call: dispatchCallHandler,
  provider_webhook: notYetImplemented("Provider webhook processing"),
  send_message: notYetImplemented("Message sending"),
  publish_post: publishPostHandler,
  fetch_analytics: notYetImplemented("Analytics sync"),
  sync_comments: notYetImplemented("Comment sync"),
  sync_messages: notYetImplemented("Message sync"),
  schedule_post: notYetImplemented("Scheduled publishing"),
  qualification: notYetImplemented("Standalone qualification job"),
  lead_followup: notYetImplemented("Lead follow-up"),
}
