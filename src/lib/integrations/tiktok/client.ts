/**
 * Real TikTok Content Posting API client, verified against TikTok's
 * current official documentation (developers.tiktok.com) - not guessed.
 * Same never-throw contract as every other provider adapter here.
 *
 * IMPORTANT PROVIDER LIMITATION (not a bug in this code): TikTok requires
 * an app audit before content published through it can be publicly
 * visible - "All content posted by unaudited clients will be restricted
 * to private viewing mode" (SELF_ONLY), regardless of what privacy_level
 * this code requests. Until EasyLife's TikTok app passes that audit,
 * every real publish will succeed but land as private-only on TikTok's
 * side, not fail outright - a real, honest provider constraint, not
 * something this code can work around.
 */
const API_BASE = "https://open.tiktokapis.com/v2"

function jsonHeaders(accessToken: string): Record<string, string> {
  return { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json; charset=UTF-8" }
}

export interface CreatorInfoResult {
  ok: boolean
  creatorUsername?: string
  privacyLevelOptions?: string[]
  errorMessage?: string
}

/** POST /post/publish/creator_info/query/ - required before every publish
 * attempt per TikTok's own docs; also the only way to know which privacy
 * levels this creator's account actually supports. */
export async function getCreatorInfo(accessToken: string): Promise<CreatorInfoResult> {
  try {
    const res = await fetch(`${API_BASE}/post/publish/creator_info/query/`, {
      method: "POST",
      headers: jsonHeaders(accessToken),
      signal: AbortSignal.timeout(15000),
    })
    const json = await res.json().catch(() => null)
    if (res.status === 401) return { ok: false, errorMessage: "TikTok authorization has expired - reconnect TikTok in Integrations." }
    if (!res.ok || json?.error?.code !== "ok") {
      return { ok: false, errorMessage: json?.error?.message ?? `TikTok API returned ${res.status}` }
    }
    return {
      ok: true,
      creatorUsername: json?.data?.creator_username,
      privacyLevelOptions: json?.data?.privacy_level_options ?? [],
    }
  } catch (error) {
    return { ok: false, errorMessage: error instanceof Error ? error.message : "Couldn't reach the TikTok API." }
  }
}

export interface PublishResult {
  ok: boolean
  publishId?: string
  externalPostId?: string
  status?: "PROCESSING_UPLOAD" | "PROCESSING_DOWNLOAD" | "PUBLISH_COMPLETE" | "FAILED"
  errorMessage?: string
}

const CHUNK_SIZE = 10 * 1024 * 1024 // 10MB - well within TikTok's chunk-count/rate-limit guidance for this app's own 100MB video cap

/** Initializes a FILE_UPLOAD video post (POST /post/publish/video/init/),
 * then PUTs the file in sequential Content-Range chunks to the returned
 * upload_url. Publishing itself is asynchronous from here - the caller
 * must poll checkPublishStatus (or better, hand off to a job-queue poller
 * like tiktokPollPublishHandler) until it reports PUBLISH_COMPLETE or
 * FAILED. */
export async function publishVideo(
  accessToken: string,
  videoBuffer: Buffer,
  title: string,
  privacyLevel: string
): Promise<PublishResult> {
  try {
    const totalChunks = Math.ceil(videoBuffer.byteLength / CHUNK_SIZE) || 1
    const initRes = await fetch(`${API_BASE}/post/publish/video/init/`, {
      method: "POST",
      headers: jsonHeaders(accessToken),
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        post_info: { title, privacy_level: privacyLevel, disable_duet: false, disable_stitch: false, disable_comment: false },
        source_info: { source: "FILE_UPLOAD", video_size: videoBuffer.byteLength, chunk_size: Math.min(CHUNK_SIZE, videoBuffer.byteLength), total_chunk_count: totalChunks },
      }),
    })
    const initJson = await initRes.json().catch(() => null)
    if (!initRes.ok || initJson?.error?.code !== "ok") {
      return { ok: false, errorMessage: initJson?.error?.message ?? `TikTok video init failed (${initRes.status})` }
    }
    const uploadUrl = initJson?.data?.upload_url as string | undefined
    const publishId = initJson?.data?.publish_id as string | undefined
    if (!uploadUrl || !publishId) return { ok: false, errorMessage: "TikTok didn't return upload instructions." }

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, videoBuffer.byteLength) - 1
      const chunk = videoBuffer.subarray(start, end + 1)
      const chunkRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "video/mp4",
          "Content-Length": String(chunk.byteLength),
          "Content-Range": `bytes ${start}-${end}/${videoBuffer.byteLength}`,
        },
        signal: AbortSignal.timeout(60000),
        body: new Uint8Array(chunk),
      })
      if (!chunkRes.ok) return { ok: false, errorMessage: `TikTok video chunk upload failed (${chunkRes.status})` }
    }

    return { ok: true, publishId, status: "PROCESSING_UPLOAD" }
  } catch (error) {
    return { ok: false, errorMessage: error instanceof Error ? error.message : "Unknown TikTok video publish error" }
  }
}

/** Initializes a photo post (POST /post/publish/content/init/) - unlike
 * video, TikTok's photo flow needs a publicly fetchable image URL (Meta's
 * fetch-based model, not a direct upload), so callers pass a signed
 * public media URL from src/lib/storage/public-url.ts, same mechanism
 * built for Instagram. */
export async function publishPhoto(accessToken: string, photoUrl: string, title: string, privacyLevel: string): Promise<PublishResult> {
  try {
    const res = await fetch(`${API_BASE}/post/publish/content/init/`, {
      method: "POST",
      headers: jsonHeaders(accessToken),
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        post_info: { title, privacy_level: privacyLevel, disable_comment: false },
        source_info: { source: "PULL_FROM_URL", photo_cover_index: 0, photo_images: [photoUrl] },
        post_mode: "DIRECT_POST",
        media_type: "PHOTO",
      }),
    })
    const json = await res.json().catch(() => null)
    if (!res.ok || json?.error?.code !== "ok") {
      return { ok: false, errorMessage: json?.error?.message ?? `TikTok photo publish failed (${res.status})` }
    }
    const publishId = json?.data?.publish_id as string | undefined
    if (!publishId) return { ok: false, errorMessage: "TikTok didn't return a publish id." }
    return { ok: true, publishId, status: "PROCESSING_DOWNLOAD" }
  } catch (error) {
    return { ok: false, errorMessage: error instanceof Error ? error.message : "Unknown TikTok photo publish error" }
  }
}

/** POST /post/publish/status/fetch/ - TikTok's own recommended poll
 * cadence is ~45s, which is why this is driven by the job queue's
 * existing exponential backoff (starting at 2 minutes) rather than a
 * tight loop - close enough to that cadence without adding new scheduling
 * infrastructure, and it never busy-waits inside one request. */
export async function checkPublishStatus(accessToken: string, publishId: string): Promise<PublishResult> {
  try {
    const res = await fetch(`${API_BASE}/post/publish/status/fetch/`, {
      method: "POST",
      headers: jsonHeaders(accessToken),
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({ publish_id: publishId }),
    })
    const json = await res.json().catch(() => null)
    if (res.status === 401) return { ok: false, errorMessage: "TikTok authorization has expired - reconnect TikTok in Integrations." }
    if (!res.ok || json?.error?.code !== "ok") {
      return { ok: false, errorMessage: json?.error?.message ?? `TikTok API returned ${res.status}` }
    }
    const status = json?.data?.status as PublishResult["status"]
    const ids = json?.data?.publicaly_available_post_id as string[] | undefined
    return {
      ok: true,
      status,
      externalPostId: ids?.[0],
      errorMessage: status === "FAILED" ? (json?.data?.fail_reason ?? "TikTok publish failed") : undefined,
    }
  } catch (error) {
    return { ok: false, errorMessage: error instanceof Error ? error.message : "Couldn't reach the TikTok API." }
  }
}
