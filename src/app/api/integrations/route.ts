import { NextResponse } from "next/server"
import { requireAuth, requireRole } from "@/lib/auth/guard"
import { listProviderViews } from "@/lib/integrations/service"
import { apiError } from "@/lib/api/errors"

/** Lists every registered provider merged with this workspace's connection
 * state. Viewable by owner/admin/manager — sales has no access to
 * integration management, enforced here server-side, not via hidden UI. */
export async function GET() {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const roleCheck = requireRole(auth.ctx, ["owner", "admin", "manager"])
    if (roleCheck) return roleCheck

    const providers = await listProviderViews(auth.ctx.workspaceId)
    return NextResponse.json({ providers })
  } catch (error) {
    return apiError(error, "Failed to load integrations")
  }
}
