import { NextResponse } from "next/server"
import { requireAuth, requireRole } from "@/lib/auth/guard"
import { resolveActiveConnection } from "@/lib/integrations/credential-resolution"
import { resolveCredentialValue } from "@/lib/integrations/service"
import { listFacebookPages } from "@/lib/integrations/facebook/client"
import { apiError } from "@/lib/api/errors"

/** Discovers Pages the workspace's connected Facebook account manages -
 * the client picks which one to publish to rather than pasting a Page ID. */
export async function GET() {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const roleCheck = requireRole(auth.ctx, ["owner", "admin"])
    if (roleCheck) return roleCheck

    const { live, row } = await resolveActiveConnection(auth.ctx.workspaceId, "facebook")
    if (!live) {
      return NextResponse.json({ error: "Facebook isn't connected and activated for this workspace." }, { status: 400 })
    }
    const { value: accessToken } = resolveCredentialValue(row, "accessToken", "facebook")
    if (!accessToken) {
      return NextResponse.json({ error: "No Facebook access token on file - reconnect Facebook in Integrations." }, { status: 400 })
    }

    const result = await listFacebookPages(accessToken)
    if (!result.ok) return NextResponse.json({ error: result.errorMessage }, { status: 502 })

    // Never return each Page's own access token to the client - it's a
    // real publishing credential, not display data. The selection route
    // re-fetches it server-side by Page id when the client picks one.
    return NextResponse.json({ pages: result.pages?.map((p) => ({ id: p.id, name: p.name })) })
  } catch (error) {
    return apiError(error, "Failed to list Facebook Pages")
  }
}
