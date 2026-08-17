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
  username?: string
  profilePictureUrl?: string
  error?: string
}

/** GET /{page-id}?fields=instagram_business_account{...} - an Instagram
 * professional account is always linked through a Facebook Page, so this
 * is how a workspace's already-selected Facebook Page resolves to the
 * Instagram account it can publish to, without a separate Instagram
 * account-picker. No Instagram account linked to the Page reads as a
 * clean, honest "not found" rather than an error. */
export async function getLinkedInstagramAccount(pageId: string, pageAccessToken: string): Promise<LinkedInstagramAccountResult> {
  try {
    const url = new URL(`${GRAPH_API_BASE}/${pageId}`)
    url.searchParams.set("fields", "instagram_business_account{id,username,profile_picture_url}")

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${pageAccessToken}` },
      signal: AbortSignal.timeout(15000),
    })
    const json = await res.json().catch(() => null)

    if (res.status === 401) return { ok: false, error: "Facebook access token is invalid or expired - reconnect Facebook." }
    if (!res.ok) return { ok: false, error: json?.error?.message ?? `Facebook API returned ${res.status}` }

    const account = json?.instagram_business_account
    const igUserId = account?.id as string | undefined
    if (!igUserId) return { ok: false, error: "This Facebook Page has no linked Instagram professional account." }
    return { ok: true, igUserId, username: account.username, profilePictureUrl: account.profile_picture_url }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Couldn't reach the Facebook API." }
  }
}

export interface PublishImageResult {
  ok: boolean
  externalPostId?: string
  errorMessage?: string
}

async function publishContainer(igUserId: string, accessToken: string, creationId: string): Promise<PublishImageResult> {
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
}

/** Two-step publish for a single image: create a media container from a
 * publicly fetchable image URL, then publish it. Image containers are
 * ready immediately - unlike video, no status polling is needed. */
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

    return publishContainer(igUserId, accessToken, creationId)
  } catch (error) {
    return { ok: false, errorMessage: error instanceof Error ? error.message : "Unknown Instagram publish error" }
  }
}

export interface CreateVideoContainerResult {
  ok: boolean
  containerId?: string
  errorMessage?: string
}

/** Step 1 of 2 for video: create a REELS container from a publicly
 * fetchable video URL. Unlike images, this does NOT return something
 * immediately publishable - Meta processes the video asynchronously, so
 * the container must be polled (see getContainerStatus) until it reports
 * FINISHED before /media_publish will succeed. REELS is Meta's current
 * recommended media_type for video in the main publishing flow. */
export async function createVideoContainer(igUserId: string, accessToken: string, videoUrl: string, caption: string): Promise<CreateVideoContainerResult> {
  try {
    const createUrl = new URL(`${GRAPH_API_BASE}/${igUserId}/media`)
    createUrl.searchParams.set("video_url", videoUrl)
    createUrl.searchParams.set("media_type", "REELS")
    if (caption) createUrl.searchParams.set("caption", caption)

    const res = await fetch(createUrl.toString(), {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(30000),
    })
    const json = await res.json().catch(() => null)
    if (!res.ok) {
      return { ok: false, errorMessage: json?.error?.message ?? `Instagram video container creation failed (${res.status})` }
    }
    const containerId = json?.id as string | undefined
    if (!containerId) return { ok: false, errorMessage: "Instagram didn't return a container id." }
    return { ok: true, containerId }
  } catch (error) {
    return { ok: false, errorMessage: error instanceof Error ? error.message : "Unknown Instagram video container error" }
  }
}

export type ContainerStatus = "IN_PROGRESS" | "FINISHED" | "ERROR" | "EXPIRED" | "PUBLISHED" | "UNKNOWN"

export interface ContainerStatusResult {
  ok: boolean
  status?: ContainerStatus
  errorMessage?: string
}

/** GET /{container-id}?fields=status_code - Meta's documented way to check
 * whether an async (video) container has finished processing. Recommended
 * cadence is once per minute for up to 5 minutes, which is exactly the
 * schedule instagram_poll_publish (see src/lib/jobs/handlers.ts) follows
 * via the job queue - never a busy-wait inside one request. */
export async function getContainerStatus(containerId: string, accessToken: string): Promise<ContainerStatusResult> {
  try {
    const url = new URL(`${GRAPH_API_BASE}/${containerId}`)
    url.searchParams.set("fields", "status_code")

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(15000),
    })
    const json = await res.json().catch(() => null)
    if (!res.ok) return { ok: false, errorMessage: json?.error?.message ?? `Instagram API returned ${res.status}` }

    const status = json?.status_code as ContainerStatus | undefined
    return { ok: true, status: status ?? "UNKNOWN" }
  } catch (error) {
    return { ok: false, errorMessage: error instanceof Error ? error.message : "Couldn't reach the Instagram API." }
  }
}

/** Step 2 of 2 for video: publish an already-FINISHED container. Exported
 * separately from publishInstagramImage's internal helper of the same
 * underlying call, since the caller here (the poll job) reaches this
 * point on a completely different job execution than the one that
 * created the container. */
export async function publishInstagramVideoContainer(igUserId: string, accessToken: string, containerId: string): Promise<PublishImageResult> {
  return publishContainer(igUserId, accessToken, containerId)
}
