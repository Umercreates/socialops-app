import { createHmac, timingSafeEqual, scryptSync } from "node:crypto"

/**
 * Short-lived, unguessable, unauthenticated media URLs - needed because
 * Instagram's Content Publishing API (unlike Facebook Pages) has no direct
 * file-upload option: it only accepts an image_url/video_url that Meta's
 * own servers fetch over the public internet, and there's no way to
 * authenticate that fetch as a specific EasyLife session. This is the one
 * deliberate, narrow exception to "media only reachable through an
 * authenticated route" - scoped to exactly one asset, expires quickly, and
 * is impossible to guess without the signature (a workspace's other media
 * stays behind normal auth).
 *
 * Signing key is derived from INTEGRATIONS_ENCRYPTION_KEY (already a
 * required, server-only secret) via a distinct salt, not reused as-is -
 * the same key-separation discipline crypto.ts already uses for its own
 * AES key, so this doesn't need a whole new env var for one narrow purpose.
 */
const SALT = "easylife-media-public-url-v1"
const DEFAULT_TTL_MS = 15 * 60 * 1000 // long enough for Meta to fetch even a large video, short enough to not matter if logged somewhere

let cachedKey: Buffer | null = null

function getSigningKey(): Buffer {
  if (cachedKey) return cachedKey
  const secret = process.env.INTEGRATIONS_ENCRYPTION_KEY
  if (!secret) throw new Error("INTEGRATIONS_ENCRYPTION_KEY is not configured")
  cachedKey = scryptSync(secret, SALT, 32)
  return cachedKey
}

function sign(assetId: string, expiresAt: number): string {
  return createHmac("sha256", getSigningKey()).update(`${assetId}.${expiresAt}`).digest("base64url")
}

/** Builds a full, publicly-fetchable URL for one media asset, valid until
 * it expires. `origin` should come from getAppOrigin() so the URL is
 * byte-correct for an external fetcher, exactly like OAuth redirect_uris
 * already are. */
export function buildPublicMediaUrl(origin: string, assetId: string, ttlMs = DEFAULT_TTL_MS): string {
  const expiresAt = Date.now() + ttlMs
  const signature = sign(assetId, expiresAt)
  return `${origin}/api/media/${assetId}/public?expires=${expiresAt}&sig=${signature}`
}

export function verifyPublicMediaAccess(assetId: string, expiresParam: string | null, sigParam: string | null): boolean {
  if (!expiresParam || !sigParam) return false
  const expiresAt = Number(expiresParam)
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false

  const expected = Buffer.from(sign(assetId, expiresAt))
  const provided = Buffer.from(sigParam)
  return expected.length === provided.length && timingSafeEqual(expected, provided)
}
