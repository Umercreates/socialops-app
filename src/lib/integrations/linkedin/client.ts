/**
 * Real LinkedIn REST API client (Posts, Images, Videos, Organization
 * Access Control), verified against LinkedIn's own current documentation
 * (learn.microsoft.com/en-us/linkedin) rather than guessed. Same
 * never-throw contract as every other provider adapter in this codebase.
 *
 * IMPORTANT PROVIDER LIMITATION (not a bug in this code): every write
 * scope used here (w_member_social, w_organization_social,
 * rw_organization_admin) is only ever granted to an app LinkedIn has
 * approved for Community Management API access - this is a manual,
 * discretionary LinkedIn review process, not an automatic/self-serve
 * grant. Until EasyLife's LinkedIn app has that approval, every call in
 * this file will fail with a real 403 from LinkedIn, regardless of how
 * correct the request is. See providers.ts's linkedin.description.
 *
 * Also real, not a limitation of this code: LinkedIn access tokens expire
 * after 60 days, and refresh tokens are only issued to approved Marketing
 * Developer Platform partners - a standard app's workspace connections
 * will need to be manually reconnected periodically rather than silently
 * auto-refreshing forever.
 */
const API_BASE = "https://api.linkedin.com"
const LINKEDIN_VERSION = "202608"

function restHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    "X-Restli-Protocol-Version": "2.0.0",
    "Linkedin-Version": LINKEDIN_VERSION,
    "Content-Type": "application/json",
  }
}

export interface MemberIdentityResult {
  ok: boolean
  personUrn?: string
  name?: string
  error?: string
}

/** GET /v2/userinfo (OpenID Connect) - resolves the authenticated
 * member's own person URN, needed as the author for a personal-profile
 * post. Requires the openid+profile scopes. */
export async function getMemberIdentity(accessToken: string): Promise<MemberIdentityResult> {
  try {
    const res = await fetch(`${API_BASE}/v2/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(15000),
    })
    const json = await res.json().catch(() => null)
    if (res.status === 401) return { ok: false, error: "LinkedIn authorization has expired - reconnect LinkedIn in Integrations." }
    if (!res.ok) return { ok: false, error: json?.message ?? `LinkedIn API returned ${res.status}` }

    const sub = json?.sub as string | undefined
    if (!sub) return { ok: false, error: "LinkedIn didn't return a member id." }
    return { ok: true, personUrn: `urn:li:person:${sub}`, name: json?.name }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Couldn't reach the LinkedIn API." }
  }
}

export interface OrganizationSummary {
  urn: string
  name: string
}

export interface ListOrganizationsResult {
  ok: boolean
  organizations?: OrganizationSummary[]
  error?: string
}

/** GET /rest/organizationAcls?q=roleAssignee&role=ADMINISTRATOR - which
 * company Pages the authenticated member administers (implicitly scoped
 * to the caller by the access token; no person URN param needed). Names
 * are resolved with one best-effort follow-up lookup per organization -
 * if that fails for one, its URN is used as a fallback label rather than
 * failing the whole list. */
export async function listAdministeredOrganizations(accessToken: string): Promise<ListOrganizationsResult> {
  try {
    const url = new URL(`${API_BASE}/rest/organizationAcls`)
    url.searchParams.set("q", "roleAssignee")
    url.searchParams.set("role", "ADMINISTRATOR")
    url.searchParams.set("state", "APPROVED")

    const res = await fetch(url.toString(), { headers: restHeaders(accessToken), signal: AbortSignal.timeout(15000) })
    const json = await res.json().catch(() => null)
    if (res.status === 401) return { ok: false, error: "LinkedIn authorization has expired - reconnect LinkedIn in Integrations." }
    if (!res.ok) return { ok: false, error: json?.message ?? `LinkedIn API returned ${res.status}` }

    const elements = Array.isArray(json?.elements) ? json.elements : []
    const orgUrns: string[] = elements.map((e: { organization?: string; organizationTarget?: string }) => e.organization ?? e.organizationTarget).filter(Boolean)

    const organizations = await Promise.all(
      orgUrns.map(async (urn): Promise<OrganizationSummary> => {
        const id = urn.split(":").pop()
        try {
          const orgRes = await fetch(`${API_BASE}/rest/organizations/${id}`, { headers: restHeaders(accessToken), signal: AbortSignal.timeout(10000) })
          const orgJson = await orgRes.json().catch(() => null)
          const name = orgJson?.localizedName ?? orgJson?.name?.localized?.en_US
          return { urn, name: typeof name === "string" && name ? name : urn }
        } catch {
          return { urn, name: urn }
        }
      })
    )

    return { ok: true, organizations }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Couldn't reach the LinkedIn API." }
  }
}

export interface PublishResult {
  ok: boolean
  externalPostId?: string
  errorMessage?: string
}

/** POST /rest/posts - text-only (or text + already-uploaded media) post.
 * author is either a person URN (member profile) or organization URN
 * (company Page); mediaUrn/mediaType are omitted for a pure text post. */
export async function createPost(
  accessToken: string,
  author: string,
  commentary: string,
  media?: { urn: string; type: "image" | "video" }
): Promise<PublishResult> {
  try {
    const body: Record<string, unknown> = {
      author,
      commentary,
      visibility: "PUBLIC",
      distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    }
    if (media) body.content = { media: { id: media.urn } }

    const res = await fetch(`${API_BASE}/rest/posts`, {
      method: "POST",
      headers: restHeaders(accessToken),
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify(body),
    })

    if (res.status === 401) return { ok: false, errorMessage: "LinkedIn authorization has expired - reconnect LinkedIn in Integrations." }
    if (res.status === 403) {
      return {
        ok: false,
        errorMessage:
          "LinkedIn rejected this request as unauthorized (403) - this app most likely hasn't been approved for Community Management API access yet, which every publish permission requires.",
      }
    }
    if (res.status !== 201) {
      const json = await res.json().catch(() => null)
      return { ok: false, errorMessage: json?.message ?? `LinkedIn publish failed (${res.status})` }
    }

    const externalPostId = res.headers.get("x-restli-id") ?? undefined
    return { ok: true, externalPostId }
  } catch (error) {
    return { ok: false, errorMessage: error instanceof Error ? error.message : "Unknown LinkedIn publish error" }
  }
}

export interface UploadImageResult {
  ok: boolean
  imageUrn?: string
  errorMessage?: string
}

/** Two-step image upload: initializeUpload registers it and returns a
 * direct PUT upload URL, then the raw bytes are uploaded there - a direct
 * upload, not a fetch-a-public-URL flow, so this reads bytes straight
 * from this app's own storage (see local-adapter.ts), same as Facebook's
 * photo upload. */
export async function uploadImage(accessToken: string, owner: string, imageBuffer: Buffer): Promise<UploadImageResult> {
  try {
    const initRes = await fetch(`${API_BASE}/rest/images?action=initializeUpload`, {
      method: "POST",
      headers: restHeaders(accessToken),
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({ initializeUploadRequest: { owner } }),
    })
    const initJson = await initRes.json().catch(() => null)
    if (!initRes.ok) return { ok: false, errorMessage: initJson?.message ?? `LinkedIn image upload init failed (${initRes.status})` }

    const uploadUrl = initJson?.value?.uploadUrl as string | undefined
    const imageUrn = initJson?.value?.image as string | undefined
    if (!uploadUrl || !imageUrn) return { ok: false, errorMessage: "LinkedIn didn't return an image upload URL." }

    // No Authorization header here, matching LinkedIn's own documented
    // video-part upload example on the same dms-uploads signed-URL
    // mechanism - the URL itself is pre-authenticated (its `ut=` query
    // param), not the request's headers.
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/octet-stream" },
      signal: AbortSignal.timeout(30000),
      body: new Uint8Array(imageBuffer),
    })
    if (!uploadRes.ok) return { ok: false, errorMessage: `LinkedIn image upload failed (${uploadRes.status})` }

    return { ok: true, imageUrn }
  } catch (error) {
    return { ok: false, errorMessage: error instanceof Error ? error.message : "Unknown LinkedIn image upload error" }
  }
}

export interface UploadVideoResult {
  ok: boolean
  videoUrn?: string
  errorMessage?: string
}

/** Multi-part video upload: initializeUpload (declares the file size,
 * gets back one signed PUT URL per 4MB part plus a video URN), upload
 * each part sequentially and collect its ETag, then finalizeUpload with
 * all the collected part IDs in order. LinkedIn always uses this
 * multi-part shape regardless of file size - there's no simpler
 * single-request path for video like Facebook's. */
export async function uploadVideo(accessToken: string, owner: string, videoBuffer: Buffer): Promise<UploadVideoResult> {
  try {
    const initRes = await fetch(`${API_BASE}/rest/videos?action=initializeUpload`, {
      method: "POST",
      headers: restHeaders(accessToken),
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({ initializeUploadRequest: { owner, fileSizeBytes: videoBuffer.byteLength } }),
    })
    const initJson = await initRes.json().catch(() => null)
    if (!initRes.ok) return { ok: false, errorMessage: initJson?.message ?? `LinkedIn video upload init failed (${initRes.status})` }

    const videoUrn = initJson?.value?.video as string | undefined
    const uploadInstructions = initJson?.value?.uploadInstructions as { uploadUrl: string; firstByte: number; lastByte: number }[] | undefined
    if (!videoUrn || !uploadInstructions?.length) return { ok: false, errorMessage: "LinkedIn didn't return video upload instructions." }

    const uploadedPartIds: string[] = []
    for (const part of uploadInstructions) {
      const chunk = videoBuffer.subarray(part.firstByte, part.lastByte + 1)
      const partRes = await fetch(part.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/octet-stream" },
        signal: AbortSignal.timeout(60000),
        body: new Uint8Array(chunk),
      })
      if (!partRes.ok) return { ok: false, errorMessage: `LinkedIn video part upload failed (${partRes.status})` }
      const etag = partRes.headers.get("etag")?.replace(/^"|"$/g, "")
      if (!etag) return { ok: false, errorMessage: "LinkedIn didn't return an ETag for an uploaded video part." }
      uploadedPartIds.push(etag)
    }

    const finalizeRes = await fetch(`${API_BASE}/rest/videos?action=finalizeUpload`, {
      method: "POST",
      headers: restHeaders(accessToken),
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({ finalizeUploadRequest: { video: videoUrn, uploadToken: "", uploadedPartIds } }),
    })
    if (!finalizeRes.ok) {
      const json = await finalizeRes.json().catch(() => null)
      return { ok: false, errorMessage: json?.message ?? `LinkedIn video upload finalize failed (${finalizeRes.status})` }
    }

    return { ok: true, videoUrn }
  } catch (error) {
    return { ok: false, errorMessage: error instanceof Error ? error.message : "Unknown LinkedIn video upload error" }
  }
}
