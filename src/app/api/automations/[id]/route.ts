import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth, requireRole } from "@/lib/auth/guard"
import { verifySameOrigin } from "@/lib/auth/csrf"
import { updateAutomation, deleteAutomation, type UpdateAutomationInput } from "@/lib/platform/automations"
import { apiError } from "@/lib/api/errors"

const stepSchema = z.object({ type: z.string(), label: z.string(), value: z.string().optional() })
const rulesSchema = z.object({
  runMode: z.enum(["manual-approval", "automatic"]),
  workingHoursOnly: z.boolean(),
  delayMinutes: z.number().int().min(0).max(1440),
  maxAttempts: z.number().int().min(1).max(10),
  escalateAfterFailures: z.boolean(),
  assignedTo: z.string().optional(),
})

const patchSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    status: z.enum(["active", "paused", "draft"]),
    platform: z.string(),
    trigger: stepSchema,
    condition: stepSchema,
    action: stepSchema,
    rules: rulesSchema,
  })
  .partial()

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const originCheck = verifySameOrigin(request)
  if (originCheck) return originCheck

  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const roleCheck = requireRole(auth.ctx, ["owner", "admin", "manager"])
    if (roleCheck) return roleCheck

    const { id } = await ctx.params
    const patch = patchSchema.parse(await request.json()) as UpdateAutomationInput

    const automation = await updateAutomation(auth.ctx.workspaceId, id, patch)
    if (!automation) return NextResponse.json({ error: "Automation not found" }, { status: 404 })

    return NextResponse.json({ automation })
  } catch (error) {
    return apiError(error, "Failed to update automation")
  }
}

export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const originCheck = verifySameOrigin(request)
  if (originCheck) return originCheck

  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const roleCheck = requireRole(auth.ctx, ["owner", "admin", "manager"])
    if (roleCheck) return roleCheck

    const { id } = await ctx.params
    await deleteAutomation(auth.ctx.workspaceId, id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return apiError(error, "Failed to delete automation")
  }
}
