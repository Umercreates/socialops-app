/**
 * Real YouTube Data API v3 client, verified against Google's current
 * official documentation - not guessed. Reuses the same Google OAuth
 * connection/token as google-sheets and google-calendar (the youtube.upload
 * scope is requested alongside them). Same never-throw contract as every
 * other provider adapter here.
 */
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"
const YOUTUBE_UPLOAD_BASE = "https://www.googleapis.com/upload/youtube/v3"

export interface ChannelSummary {
  id: string
  title: string
}

export interface ListChannelsResult {
  ok: boolean
  channels?: ChannelSummary[]
  error?: string
}

/** GET /channels?mine=true - the channel(s) owned by the connected Google
 * account. Uploads always go to the account's own channel (YouTube has no
 * per-request "publish as this channel" parameter for a normal OAuth
 * grant), so this is for confirming/displaying which channel that is,
 * not for selecting a publish target the way Facebook's Page picker does. */
export async function listMyChannels(accessToken: string): Promise<ListChannelsResult> {
  try {
    const url = new URL(`${YOUTUBE_API_BASE}/channels`)
    url.searchParams.set("part", "snippet")
    url.searchParams.set("mine", "true")

    const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(15000) })
    const json = await res.json().catch(() => null)
    if (res.status === 401) return { ok: false, error: "Google authorization has expired - reconnect Google in Integrations." }
    if (!res.ok) return { ok: false, error: json?.error?.message ?? `YouTube API returned ${res.status}` }

    const items = Array.isArray(json?.items) ? json.items : []
    return { ok: true, channels: items.map((c: { id: string; snippet?: { title?: string } }) => ({ id: c.id, title: c.snippet?.title ?? c.id })) }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Couldn't reach the YouTube API." }
  }
}

export interface UploadVideoInput {
  buffer: Buffer
  mimeType: string
  title: string
  description: string
  privacyStatus: "private" | "unlisted" | "public"
}

export interface UploadVideoResult {
  ok: boolean
  externalVideoId?: string
  videoUrl?: string
  errorMessage?: string
}

/** Resumable upload protocol: a POST declaring the metadata + real
 * content-length/type via X-Upload-Content-* headers gets back a session
 * URI in the Location header, then the actual bytes go to that URI in one
 * PUT (single-request is valid per Google's own protocol for files that
 * fit in one request - this app's own 100MB video cap comfortably does).
 * A network failure mid-upload is a real, honest failure here, not
 * retried with the resumable Content-Range mechanics - that's a further
 * enhancement, not something silently pretended to work. */
export async function uploadVideo(accessToken: string, input: UploadVideoInput): Promise<UploadVideoResult> {
  try {
    const initUrl = new URL(`${YOUTUBE_UPLOAD_BASE}/videos`)
    initUrl.searchParams.set("uploadType", "resumable")
    initUrl.searchParams.set("part", "snippet,status")

    const metadata = {
      snippet: { title: input.title, description: input.description },
      status: { privacyStatus: input.privacyStatus },
    }

    const initRes = await fetch(initUrl.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": input.mimeType,
        "X-Upload-Content-Length": String(input.buffer.byteLength),
      },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify(metadata),
    })
    if (initRes.status === 401) return { ok: false, errorMessage: "Google authorization has expired - reconnect Google in Integrations." }
    if (!initRes.ok) {
      const json = await initRes.json().catch(() => null)
      return { ok: false, errorMessage: json?.error?.message ?? `YouTube upload session couldn't be created (${initRes.status})` }
    }
    const sessionUrl = initRes.headers.get("location")
    if (!sessionUrl) return { ok: false, errorMessage: "YouTube didn't return an upload session URL." }

    const uploadRes = await fetch(sessionUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": input.mimeType,
        "Content-Length": String(input.buffer.byteLength),
      },
      signal: AbortSignal.timeout(120000),
      body: new Uint8Array(input.buffer),
    })
    const uploadJson = await uploadRes.json().catch(() => null)
    if (!uploadRes.ok) return { ok: false, errorMessage: uploadJson?.error?.message ?? `YouTube upload failed (${uploadRes.status})` }

    const videoId = uploadJson?.id as string | undefined
    if (!videoId) return { ok: false, errorMessage: "YouTube didn't return a video id." }
    return { ok: true, externalVideoId: videoId, videoUrl: `https://www.youtube.com/watch?v=${videoId}` }
  } catch (error) {
    return { ok: false, errorMessage: error instanceof Error ? error.message : "Unknown YouTube upload error" }
  }
}
