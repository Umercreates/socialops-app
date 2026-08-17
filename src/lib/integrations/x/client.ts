/**
 * Real X (Twitter) API v2 client, verified against X's current official
 * documentation (docs.x.com) - not guessed. Same never-throw contract as
 * every other provider adapter here.
 *
 * IMPORTANT PROVIDER LIMITATION (not a bug in this code): X API v2 has no
 * free tier for write access - posting is pay-per-usage, billed per
 * request against credits purchased in X's Developer Console. Every call
 * in this file will genuinely fail (with a real, honest error) until
 * EasyLife's X developer account has credits/billing configured. This is
 * a provider billing requirement, not a software gap.
 */
const API_BASE = "https://api.x.com/2"
const MEDIA_CHUNK_SIZE = 1 * 1024 * 1024 // 1MB - X's community-documented safe chunk size (larger APPEND chunks are reported to fail)

export interface MemberIdentityResult {
  ok: boolean
  userId?: string
  username?: string
  error?: string
}

/** GET /users/me - the authenticated account's own id/username, used as
 * the identity display in Integrations (X posts are always authored as
 * whichever account authorized the app; there's no organization/Page
 * concept to pick between, unlike Facebook or LinkedIn). */
export async function getMe(accessToken: string): Promise<MemberIdentityResult> {
  try {
    const res = await fetch(`${API_BASE}/users/me`, { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(15000) })
    const json = await res.json().catch(() => null)
    if (res.status === 401) return { ok: false, error: "X authorization has expired - reconnect X in Integrations." }
    if (!res.ok) return { ok: false, error: json?.detail ?? json?.title ?? `X API returned ${res.status}` }
    return { ok: true, userId: json?.data?.id, username: json?.data?.username }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Couldn't reach the X API." }
  }
}

export interface PublishResult {
  ok: boolean
  externalPostId?: string
  errorMessage?: string
}

/** POST /tweets - text-only, or text + already-uploaded media (see
 * uploadMedia). */
export async function createPost(accessToken: string, text: string, mediaIds?: string[]): Promise<PublishResult> {
  try {
    const body: Record<string, unknown> = { text }
    if (mediaIds?.length) body.media = { media_ids: mediaIds }

    const res = await fetch(`${API_BASE}/tweets`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify(body),
    })
    const json = await res.json().catch(() => null)
    if (res.status === 401) return { ok: false, errorMessage: "X authorization has expired - reconnect X in Integrations." }
    if (res.status === 402 || res.status === 429) {
      return { ok: false, errorMessage: "X rejected this request - this app's X developer account likely needs billing/credits configured, or has hit its rate limit." }
    }
    if (!res.ok) return { ok: false, errorMessage: json?.detail ?? json?.title ?? `X publish failed (${res.status})` }

    return { ok: true, externalPostId: json?.data?.id }
  } catch (error) {
    return { ok: false, errorMessage: error instanceof Error ? error.message : "Unknown X publish error" }
  }
}

export interface UploadMediaResult {
  ok: boolean
  mediaId?: string
  errorMessage?: string
}

/** Three-step chunked media upload (INIT -> APPEND -> FINALIZE), all on
 * the same /2/media/upload endpoint distinguished by a `command` field -
 * X's long-standing convention for this endpoint family, unchanged by the
 * v1.1-to-v2 migration. For video, FINALIZE returns a processing state
 * that needs polling (see waitForMediaProcessing) before the media_id is
 * usable in a post; images are typically ready immediately. */
export async function uploadMedia(accessToken: string, buffer: Buffer, mimeType: string, isVideo: boolean): Promise<UploadMediaResult> {
  try {
    const initForm = new FormData()
    initForm.append("command", "INIT")
    initForm.append("media_type", mimeType)
    initForm.append("total_bytes", String(buffer.byteLength))
    initForm.append("media_category", isVideo ? "tweet_video" : "tweet_image")

    const initRes = await fetch(`${API_BASE}/media/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(15000),
      body: initForm,
    })
    const initJson = await initRes.json().catch(() => null)
    if (!initRes.ok) return { ok: false, errorMessage: initJson?.detail ?? initJson?.title ?? `X media init failed (${initRes.status})` }
    const mediaId = initJson?.data?.id as string | undefined
    if (!mediaId) return { ok: false, errorMessage: "X didn't return a media id." }

    let segmentIndex = 0
    for (let offset = 0; offset < buffer.byteLength; offset += MEDIA_CHUNK_SIZE) {
      const chunk = buffer.subarray(offset, Math.min(offset + MEDIA_CHUNK_SIZE, buffer.byteLength))
      const appendForm = new FormData()
      appendForm.append("command", "APPEND")
      appendForm.append("media_id", mediaId)
      appendForm.append("segment_index", String(segmentIndex))
      appendForm.append("media", new Blob([new Uint8Array(chunk)], { type: mimeType }))

      const appendRes = await fetch(`${API_BASE}/media/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(60000),
        body: appendForm,
      })
      if (!appendRes.ok) {
        const appendJson = await appendRes.json().catch(() => null)
        return { ok: false, errorMessage: appendJson?.detail ?? appendJson?.title ?? `X media chunk upload failed (${appendRes.status})` }
      }
      segmentIndex += 1
    }

    const finalizeForm = new FormData()
    finalizeForm.append("command", "FINALIZE")
    finalizeForm.append("media_id", mediaId)
    const finalizeRes = await fetch(`${API_BASE}/media/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(20000),
      body: finalizeForm,
    })
    const finalizeJson = await finalizeRes.json().catch(() => null)
    if (!finalizeRes.ok) return { ok: false, errorMessage: finalizeJson?.detail ?? finalizeJson?.title ?? `X media finalize failed (${finalizeRes.status})` }

    return { ok: true, mediaId }
  } catch (error) {
    return { ok: false, errorMessage: error instanceof Error ? error.message : "Unknown X media upload error" }
  }
}

export interface MediaStatusResult {
  ok: boolean
  state?: "pending" | "in_progress" | "succeeded" | "failed"
  errorMessage?: string
}

/** GET /media/upload?command=STATUS - only meaningful for video/GIF,
 * which process asynchronously after FINALIZE; images are immediately
 * "succeeded" and don't need this checked. */
export async function checkMediaStatus(accessToken: string, mediaId: string): Promise<MediaStatusResult> {
  try {
    const url = new URL(`${API_BASE}/media/upload`)
    url.searchParams.set("command", "STATUS")
    url.searchParams.set("media_id", mediaId)

    const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(15000) })
    const json = await res.json().catch(() => null)
    if (!res.ok) return { ok: false, errorMessage: json?.detail ?? json?.title ?? `X API returned ${res.status}` }

    const state = json?.data?.processing_info?.state as MediaStatusResult["state"] | undefined
    return { ok: true, state: state ?? "succeeded", errorMessage: state === "failed" ? (json?.data?.processing_info?.error?.message ?? "X media processing failed") : undefined }
  } catch (error) {
    return { ok: false, errorMessage: error instanceof Error ? error.message : "Couldn't reach the X API." }
  }
}
