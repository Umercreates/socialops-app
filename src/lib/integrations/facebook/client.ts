/**
 * Official Meta Graph API client for Facebook Page publishing. Same
 * transport family as the WhatsApp Cloud API client (graph.facebook.com),
 * same never-throw contract: every function returns a result object, the
 * caller decides what a failure means for its own record-keeping.
 *
 * A user's OAuth access token (stored on connect) can manage several Pages
 * at once and cannot itself post to any of them - Meta requires the
 * per-Page access token returned by /me/accounts for that. listFacebookPages
 * is how a workspace discovers which Pages it can choose from; the chosen
 * Page's own token (not the user token) is what publishTextPost needs.
 */
const GRAPH_API_VERSION = "v21.0"
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`

export interface FacebookPage {
  id: string
  name: string
  accessToken: string
}

export interface ListPagesResult {
  ok: boolean
  pages?: FacebookPage[]
  errorMessage?: string
}

/** GET /me/accounts - every Page the authorizing user manages, each with its
 * own long-lived Page access token (distinct from the user token used to
 * call this endpoint). Requires the pages_show_list scope already requested
 * at connect time. */
export async function listFacebookPages(userAccessToken: string): Promise<ListPagesResult> {
  try {
    const res = await fetch(`${GRAPH_API_BASE}/me/accounts?fields=id,name,access_token`, {
      headers: { Authorization: `Bearer ${userAccessToken}` },
      signal: AbortSignal.timeout(15000),
    })

    const json = await res.json().catch(() => null)
    if (!res.ok) {
      const code = json?.error?.code
      if (code === 190) return { ok: false, errorMessage: "Facebook access token is invalid or expired - reconnect Facebook." }
      return { ok: false, errorMessage: json?.error?.message ?? `Facebook API returned ${res.status}` }
    }

    const pages: FacebookPage[] = (json?.data ?? []).map((p: { id: string; name: string; access_token: string }) => ({
      id: p.id,
      name: p.name,
      accessToken: p.access_token,
    }))
    return { ok: true, pages }
  } catch (error) {
    return { ok: false, errorMessage: error instanceof Error ? error.message : "Couldn't reach the Facebook API." }
  }
}

export interface SubscribeResult {
  ok: boolean
  errorMessage?: string
}

/** POST /{page-id}/subscribed_apps?subscribed_fields=feed,comments -
 * subscribes this Page (and its linked Instagram account, if any) to
 * real-time comment webhooks, using the platform app already registered
 * with a callback URL and verify token in the Meta App Dashboard. This is
 * what makes comment ingestion "zero client setup": the client only picks
 * a Page, this call does the rest server-side. Requires
 * pages_manage_metadata. */
export async function subscribePageToWebhooks(pageId: string, pageAccessToken: string): Promise<SubscribeResult> {
  try {
    const res = await fetch(`${GRAPH_API_BASE}/${pageId}/subscribed_apps?subscribed_fields=feed,comments`, {
      method: "POST",
      headers: { Authorization: `Bearer ${pageAccessToken}` },
      signal: AbortSignal.timeout(15000),
    })
    const json = await res.json().catch(() => null)
    if (!res.ok || json?.success === false) {
      return { ok: false, errorMessage: json?.error?.message ?? `Facebook webhook subscription failed (${res.status})` }
    }
    return { ok: true }
  } catch (error) {
    return { ok: false, errorMessage: error instanceof Error ? error.message : "Unknown Facebook subscription error" }
  }
}

export interface PublishTextPostResult {
  ok: boolean
  externalPostId?: string
  errorMessage?: string
}

export interface ReplyToCommentResult {
  ok: boolean
  replyId?: string
  errorMessage?: string
}

/** POST /{comment-id}/comments - replies to a Page post comment. Requires
 * the Page access token from a user who can MODERATE the Page
 * (pages_manage_engagement scope). */
export async function replyToFacebookComment(commentId: string, pageAccessToken: string, message: string): Promise<ReplyToCommentResult> {
  try {
    const res = await fetch(`${GRAPH_API_BASE}/${commentId}/comments`, {
      method: "POST",
      headers: { Authorization: `Bearer ${pageAccessToken}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({ message }),
    })
    const json = await res.json().catch(() => null)
    if (!res.ok) return { ok: false, errorMessage: json?.error?.message ?? `Facebook reply failed (${res.status})` }
    return { ok: true, replyId: json?.id }
  } catch (error) {
    return { ok: false, errorMessage: error instanceof Error ? error.message : "Unknown Facebook reply error" }
  }
}

/** POST /{page-id}/feed - publishes a text (optionally link-carrying) post
 * to a Page's feed using that Page's own access token. */
export async function publishTextPost(pageId: string, pageAccessToken: string, message: string): Promise<PublishTextPostResult> {
  try {
    const res = await fetch(`${GRAPH_API_BASE}/${pageId}/feed`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({ message }),
    })

    const json = await res.json().catch(() => null)
    if (!res.ok) {
      return { ok: false, errorMessage: json?.error?.message ?? `Facebook publish failed (${res.status})` }
    }

    const externalPostId = json?.id as string | undefined
    return { ok: true, externalPostId }
  } catch (error) {
    return { ok: false, errorMessage: error instanceof Error ? error.message : "Unknown Facebook publish error" }
  }
}

/** POST /{page-id}/photos with a direct multipart `source` upload -
 * deliberately not the `url` variant (which would need the image to be
 * publicly fetchable by Meta's servers). This app's media lives behind an
 * authenticated retrieval route, so the caller reads the file's own bytes
 * server-side and hands them here directly; nothing about the image ever
 * needs to be publicly reachable. A published photo appears in the Page's
 * feed automatically (Graph API's default `published: true`). */
export async function publishImagePost(
  pageId: string,
  pageAccessToken: string,
  imageBuffer: Buffer,
  mimeType: string,
  caption: string
): Promise<PublishTextPostResult> {
  try {
    const form = new FormData()
    form.append("source", new Blob([new Uint8Array(imageBuffer)], { type: mimeType }))
    if (caption) form.append("caption", caption)

    const res = await fetch(`${GRAPH_API_BASE}/${pageId}/photos`, {
      method: "POST",
      headers: { Authorization: `Bearer ${pageAccessToken}` },
      signal: AbortSignal.timeout(30000),
      body: form,
    })

    const json = await res.json().catch(() => null)
    if (!res.ok) {
      return { ok: false, errorMessage: json?.error?.message ?? `Facebook photo publish failed (${res.status})` }
    }

    const externalPostId = (json?.post_id ?? json?.id) as string | undefined
    return { ok: true, externalPostId }
  } catch (error) {
    return { ok: false, errorMessage: error instanceof Error ? error.message : "Unknown Facebook photo publish error" }
  }
}

/** POST /{page-id}/videos with a direct multipart `source` upload - the
 * simple, single-request path Meta's own API reference documents for
 * /{page-id}/videos (distinct from the separate, session-based Resumable
 * Upload API meant for very large files). Appropriate for this app's own
 * 100MB upload cap; a file that size is well inside what the direct path
 * supports. Genuinely not implemented: the Resumable Upload API for files
 * this app doesn't accept in the first place, and there's no evidence a
 * chunked flow is needed below that cap - if Meta's response says
 * otherwise for a specific file, that real error is what gets recorded,
 * never a silently swallowed failure. A long timeout accounts for upload
 * time on a shared host with no guaranteed fast egress; a very slow link
 * could still exceed it, in which case the honest fetch error is what's
 * recorded - no fake success. */
export async function publishVideoPost(
  pageId: string,
  pageAccessToken: string,
  videoBuffer: Buffer,
  mimeType: string,
  description: string
): Promise<PublishTextPostResult> {
  try {
    const form = new FormData()
    form.append("source", new Blob([new Uint8Array(videoBuffer)], { type: mimeType }))
    if (description) form.append("description", description)

    const res = await fetch(`${GRAPH_API_BASE}/${pageId}/videos`, {
      method: "POST",
      headers: { Authorization: `Bearer ${pageAccessToken}` },
      signal: AbortSignal.timeout(120000),
      body: form,
    })

    const json = await res.json().catch(() => null)
    if (!res.ok) {
      return { ok: false, errorMessage: json?.error?.message ?? `Facebook video publish failed (${res.status})` }
    }

    const externalPostId = json?.id as string | undefined
    return { ok: true, externalPostId }
  } catch (error) {
    return { ok: false, errorMessage: error instanceof Error ? error.message : "Unknown Facebook video publish error" }
  }
}
