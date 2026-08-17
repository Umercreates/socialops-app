import { NextResponse } from "next/server"
import { requireAuth, requireRole } from "@/lib/auth/guard"
import { verifySameOrigin } from "@/lib/auth/csrf"
import { getAutomationRun, resolveAutomationRun, getAutomation } from "@/lib/platform/automations"
import { approveAutomationRun } from "@/lib/automations/engine"
import { apiError } from "@/lib/api/errors"

/** A human approving a manual-approval automation run - the action only
 * ever executes from here (or the fully-automatic engine path), never
 * merely because a run row exists in "pending-approval". */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const originCheck = verifySameOrigin(request)
  if (originCheck) return originCheck

  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const roleCheck = requireRole(auth.ctx, ["owner", "admin", "manager"])
    if (roleCheck) return roleCheck

    const { id } = await ctx.params
    const run = await getAutomationRun(auth.ctx.workspaceId, id)
    if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 })
    if (run.status !== "pending-approval") {
      return NextResponse.json({ error: `This run is already ${run.status}, not pending approval.` }, { status: 400 })
    }

    const automation = await getAutomation(auth.ctx.workspaceId, run.automationId)
    if (!automation) return NextResponse.json({ error: "Automation not found" }, { status: 404 })

    const result = await approveAutomationRun(auth.ctx.workspaceId, automation, run.triggerContext, auth.ctx.userId)
    const updated = await resolveAutomationRun(id, result.status, result.errorMessage)

    return NextResponse.json({ run: updated })
  } catch (error) {
    return apiError(error, "Failed to approve automation run")
  }
}
