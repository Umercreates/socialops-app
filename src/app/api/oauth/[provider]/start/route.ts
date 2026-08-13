import { NextResponse } from "next/server"
import { requireAuth, requireRole } from "@/lib/auth/guard"
import { isProviderId, PROVIDER_REGISTRY } from "@/lib/integrations/providers"
import { getConnection } from "@/lib/integrations/repository"
import { resolveCredentialValue } from "@/lib/integrations/service"
import { startOAuthFlow } from "@/lib/integrations/oauth"
import { apiError } from "@/lib/api/errors"

/** Begins an OAuth connection: redirects the browser to the provider's
 * authorization screen. Requires a workspace-saved Client ID for this
 * provider - there is no shared platform-wide app credential, since each
 * client authorizes under their own developer app. */
export async function GET(request: Request, ctx: { params: Promise<{ provider: string }> }) {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const roleCheck = requireRole(auth.ctx, ["owner", "admin"])
    if (roleCheck) return roleCheck

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

    const origin = new URL(request.url).origin
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
