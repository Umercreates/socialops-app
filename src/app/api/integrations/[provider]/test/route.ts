import { NextResponse } from "next/server"
import { requireAuth, requireRole } from "@/lib/auth/guard"
import { verifySameOrigin } from "@/lib/auth/csrf"
import { requireClientMode } from "@/lib/auth/dashboard-mode-guard"
import { isProviderId } from "@/lib/integrations/providers"
import { recordConnectionTest, getProviderView } from "@/lib/integrations/service"
import { testProviderConnection } from "@/lib/integrations/test-connection"
import { apiError } from "@/lib/api/errors"

/** Server-side "Test Connection" — the browser never calls a provider's API
 * directly with a private key; it only ever calls this route. */
export async function POST(request: Request, ctx: { params: Promise<{ provider: string }> }) {
  const originCheck = verifySameOrigin(request)
  if (originCheck) return originCheck

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

    const result = await testProviderConnection(auth.ctx.workspaceId, provider)
    await recordConnectionTest(auth.ctx.workspaceId, provider, auth.ctx.userId, result)

    const view = await getProviderView(auth.ctx.workspaceId, provider)
    return NextResponse.json({ ok: result.ok, message: result.message, provider: view })
  } catch (error) {
    return apiError(error, "Connection test failed")
  }
}
