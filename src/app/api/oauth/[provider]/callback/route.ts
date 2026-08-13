import { NextResponse } from "next/server"
import { isProviderId } from "@/lib/integrations/providers"
import { getConnection, recordAuditEvent } from "@/lib/integrations/repository"
import { resolveCredentialValue, storeOAuthTokens } from "@/lib/integrations/service"
import { consumeOAuthState, exchangeCodeForToken } from "@/lib/integrations/oauth"
import { apiError } from "@/lib/api/errors"

/**
 * OAuth callback - the provider redirects the browser here after the user
 * approves (or denies) access. Deliberately resolves the workspace/actor
 * from the previously-persisted, single-use state row rather than the
 * current session, since some browsers drop first-party context across an
 * external redirect hop. A missing/expired/already-used/provider-mismatched
 * state is rejected outright - this is the CSRF protection.
 */
export async function GET(request: Request, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params
  const url = new URL(request.url)
  const redirectBase = `${url.origin}/dashboard/integrations`

  try {
    if (!isProviderId(provider)) {
      return NextResponse.json({ error: "Unknown provider" }, { status: 404 })
    }

    const providerError = url.searchParams.get("error")
    if (providerError) {
      return NextResponse.redirect(`${redirectBase}?oauth=denied&provider=${provider}`)
    }

    const code = url.searchParams.get("code")
    const state = url.searchParams.get("state")
    if (!code || !state) {
      return NextResponse.redirect(`${redirectBase}?oauth=invalid&provider=${provider}`)
    }

    const consumed = await consumeOAuthState(state, provider)
    if (!consumed) {
      // Expired, already used, or forged - never proceed.
      return NextResponse.redirect(`${redirectBase}?oauth=invalid&provider=${provider}`)
    }

    const row = await getConnection(consumed.workspaceId, provider)
    const { value: clientId } = resolveCredentialValue(row, "clientId", provider)
    const { value: clientSecret } = resolveCredentialValue(row, "clientSecret", provider)
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${redirectBase}?oauth=not_configured&provider=${provider}`)
    }

    const callbackUrl = `${url.origin}/api/oauth/${provider}/callback`
    const exchange = await exchangeCodeForToken(provider, code, clientId, clientSecret, callbackUrl, consumed.codeVerifier)

    if (!exchange.ok || !exchange.accessToken) {
      await recordAuditEvent(consumed.workspaceId, provider, "connection_test_failed", consumed.actorUserId, {
        step: "oauth_token_exchange",
      })
      return NextResponse.redirect(`${redirectBase}?oauth=failed&provider=${provider}`)
    }

    await storeOAuthTokens({
      workspaceId: consumed.workspaceId,
      provider,
      actorUserId: consumed.actorUserId,
      accessToken: exchange.accessToken,
      refreshToken: exchange.refreshToken,
      expiresInSeconds: exchange.expiresInSeconds,
    })

    return NextResponse.redirect(`${redirectBase}?oauth=connected&provider=${provider}`)
  } catch (error) {
    console.error("OAuth callback error:", error instanceof Error ? error.message : error)
    return apiError(error, "OAuth callback failed")
  }
}
