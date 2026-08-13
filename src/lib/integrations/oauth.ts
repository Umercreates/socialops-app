import { randomUUID, randomBytes, createHash } from "node:crypto"
import { eq, lt } from "drizzle-orm"
import { withDb } from "@/lib/db/client"
import { oauthStates } from "@/lib/db/schema"
import { PROVIDER_REGISTRY, type ProviderId } from "./providers"

/**
 * Generic OAuth connection framework shared by every OAuth provider (Meta,
 * Google, LinkedIn, TikTok, X). A provider-specific adapter only needs to
 * supply its authorizationUrl/tokenUrl/scopes (see providers.ts) - the
 * state/CSRF/PKCE/exchange machinery here is written once.
 *
 * No live authorization is ever performed without real per-workspace App
 * credentials on file; without them, starting a flow fails with a clear
 * "not configured" error rather than silently doing nothing.
 */

const STATE_TTL_MS = 10 * 60 * 1000 // 10 minutes - long enough for a real login flow, short enough to limit replay risk

function base64url(input: Buffer): string {
  return input.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

export interface StartOAuthInput {
  workspaceId: string
  provider: ProviderId
  actorUserId: string
  redirectPath?: string
}

export interface StartOAuthResult {
  authorizationUrl: string
  state: string
}

/** Creates and persists a random CSRF state (plus a PKCE verifier for
 * providers that require it), and builds the full authorization URL the
 * browser should be redirected to. Requires a workspace-saved Client ID -
 * this never falls back to a shared platform-wide app credential, since
 * each client authorizes under their own developer app. */
export async function startOAuthFlow(
  input: StartOAuthInput,
  clientId: string,
  callbackUrl: string
): Promise<StartOAuthResult> {
  const def = PROVIDER_REGISTRY[input.provider]
  if (!def.requiresOAuth || !def.oauth) {
    throw new Error(`${def.name} is not an OAuth provider`)
  }

  const state = base64url(randomBytes(32))
  const usesPkce = def.oauth.usesPkce === true
  const codeVerifier = usesPkce ? base64url(randomBytes(32)) : null

  await withDb(async (db) => {
    await db.insert(oauthStates).values({
      id: randomUUID(),
      workspaceId: input.workspaceId,
      provider: input.provider,
      actorUserId: input.actorUserId,
      state,
      codeVerifier,
      redirectPath: input.redirectPath ?? null,
      expiresAt: new Date(Date.now() + STATE_TTL_MS),
    })
  })

  const url = new URL(def.oauth.authorizationUrl)
  url.searchParams.set("client_id", clientId)
  url.searchParams.set("redirect_uri", callbackUrl)
  url.searchParams.set("state", state)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("scope", def.oauth.scopes.join(" "))
  if (usesPkce && codeVerifier) {
    const challenge = base64url(createHash("sha256").update(codeVerifier).digest())
    url.searchParams.set("code_challenge", challenge)
    url.searchParams.set("code_challenge_method", "S256")
  }

  return { authorizationUrl: url.toString(), state }
}

export interface ConsumedOAuthState {
  workspaceId: string
  provider: ProviderId
  actorUserId: string | null
  codeVerifier: string | null
  redirectPath: string | null
}

/** Verifies the state came from us, hasn't expired, and hasn't already been
 * used (single-use, blocking replay). Returns null on any failure - the
 * callback route must treat that as "reject," never "proceed anyway." */
export async function consumeOAuthState(state: string, provider: ProviderId): Promise<ConsumedOAuthState | null> {
  return withDb(async (db) => {
    const rows = await db.select().from(oauthStates).where(eq(oauthStates.state, state)).limit(1)
    const row = rows[0]
    if (!row) return null
    if (row.provider !== provider) return null
    if (row.usedAt) return null
    if (row.expiresAt.getTime() < Date.now()) return null

    await db.update(oauthStates).set({ usedAt: new Date() }).where(eq(oauthStates.id, row.id))

    return {
      workspaceId: row.workspaceId,
      provider: row.provider as ProviderId,
      actorUserId: row.actorUserId,
      codeVerifier: row.codeVerifier,
      redirectPath: row.redirectPath,
    }
  })
}

export interface TokenExchangeResult {
  ok: boolean
  accessToken?: string
  refreshToken?: string
  expiresInSeconds?: number
  error?: string
}

/** Exchanges an authorization code for tokens. Never throws - a failed
 * exchange (wrong code, wrong secret, provider outage) returns `ok: false`
 * with a safe message, never a stack trace, and never marks anything
 * connected. */
export async function exchangeCodeForToken(
  provider: ProviderId,
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  codeVerifier: string | null
): Promise<TokenExchangeResult> {
  const def = PROVIDER_REGISTRY[provider]
  if (!def.oauth) return { ok: false, error: `${def.name} is not an OAuth provider` }

  try {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    })
    if (codeVerifier) body.set("code_verifier", codeVerifier)

    const res = await fetch(def.oauth.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: body.toString(),
      signal: AbortSignal.timeout(15000),
    })

    const json = await res.json().catch(() => null)
    if (!res.ok || !json?.access_token) {
      return { ok: false, error: json?.error_description ?? json?.error ?? `Token exchange failed (${res.status})` }
    }

    return {
      ok: true,
      accessToken: json.access_token,
      refreshToken: json.refresh_token,
      expiresInSeconds: json.expires_in,
    }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown token exchange error" }
  }
}

export interface RefreshTokenResult {
  ok: boolean
  accessToken?: string
  refreshToken?: string
  expiresInSeconds?: number
  error?: string
}

/** Exchanges a stored refresh token for a new access token. Same
 * never-throws contract as exchangeCodeForToken - a failure is reported,
 * never silently swallowed, so the caller can mark the connection expired
 * rather than keep using a dead token. */
export async function refreshAccessToken(
  provider: ProviderId,
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<RefreshTokenResult> {
  const def = PROVIDER_REGISTRY[provider]
  if (!def.oauth) return { ok: false, error: `${def.name} is not an OAuth provider` }

  try {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    })

    const res = await fetch(def.oauth.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: body.toString(),
      signal: AbortSignal.timeout(15000),
    })

    const json = await res.json().catch(() => null)
    if (!res.ok || !json?.access_token) {
      return { ok: false, error: json?.error_description ?? json?.error ?? `Token refresh failed (${res.status})` }
    }

    return {
      ok: true,
      accessToken: json.access_token,
      refreshToken: json.refresh_token ?? refreshToken,
      expiresInSeconds: json.expires_in,
    }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown token refresh error" }
  }
}

/** Housekeeping - deletes expired, never-used states. Safe to call from the
 * cron worker; never touches a state that's still within its TTL. */
export async function pruneExpiredOAuthStates(): Promise<number> {
  return withDb(async (db) => {
    const deleted = await db.delete(oauthStates).where(lt(oauthStates.expiresAt, new Date())).returning({ id: oauthStates.id })
    return deleted.length
  })
}
