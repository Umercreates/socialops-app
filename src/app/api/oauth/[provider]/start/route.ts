import { NextResponse } from "next/server"
import { requireAuth, requireRole } from "@/lib/auth/guard"
import { requireClientMode } from "@/lib/auth/dashboard-mode-guard"
import { isProviderId, PROVIDER_REGISTRY } from "@/lib/integrations/providers"
import { getConnection } from "@/lib/integrations/repository"
import { resolveCredentialValue } from "@/lib/integrations/service"
import { startOAuthFlow } from "@/lib/integrations/oauth"
import { getAppOrigin } from "@/lib/app-url"
import { apiError } from "@/lib/api/errors"

/** Begins an OAuth connection: redirects the browser to the provider's
 * authorization screen. Resolves a Client ID via resolveCredentialValue,
 * which checks a workspace-saved value first, then falls back to the
 * platform's own app credential (platformAppEnvVars) when the provider
 * defines one - so a workspace with no saved Client ID can still connect
 * using EasyLife's own registered app, and only needs to supply its own
 * when it wants to authorize under a different developer app (e.g. an
 * agency reselling under its own app). */
export async function GET(request: Request, ctx: { params: Promise<{ provider: string }> }) {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const roleCheck = requireRole(auth.ctx, ["owner", "admin"])
    if (roleCheck) return roleCheck
    const modeCheck = await requireClientMode()
    if (modeCheck) return modeCheck

    const { provider } = await ctx.params
    if (!isProviderId(provider)) {
      return NextResponse.json({ error: "Unknown provider" }, { status: 404 })
    }
    const def = PROVIDER_REGISTRY[provider]
    if (!def.requiresOAuth || !def.oauth) {
      return NextResponse.json({ error: `${def.name} does not use OAuth` }, { status: 400 })
    }

    const row = await getConnection(auth.ctx.workspaceId, provider)
    const { value: clientId } = resolveCredentialValue(row, "clientId", provider)
    if (!clientId) {
      return NextResponse.json(
        { error: `Save this provider's Client ID and Client secret before connecting.` },
        { status: 400 }
      )
    }

    const origin = getAppOrigin(request)
    const callbackUrl = `${origin}/api/oauth/${provider}/callback`

    const { authorizationUrl } = await startOAuthFlow(
      { workspaceId: auth.ctx.workspaceId, provider, actorUserId: auth.ctx.userId, redirectPath: "/dashboard/integrations" },
      clientId,
      callbackUrl
    )

    return NextResponse.redirect(authorizationUrl)
  } catch (error) {
    return apiError(error, "Failed to start OAuth connection")
  }
}
