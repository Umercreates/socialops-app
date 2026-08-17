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

export interface PublishTextPostResult {
  ok: boolean
  externalPostId?: string
  errorMessage?: string
}

/** POST /{page-id}/feed - publishes a text (optionally link-carrying) post
 * to a Page's feed using that Page's own access token. Photo/video posts
 * need a publicly fetchable media URL or a binary upload, neither of which
 * this app has yet (composer media are client-side object URLs) - so this
 * intentionally only covers the text case; callers must not use this for a
 * post that has attached media. */
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
