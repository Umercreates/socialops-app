import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth, requireRole } from "@/lib/auth/guard"
import { verifySameOrigin } from "@/lib/auth/csrf"
import { listAutomations, createAutomation } from "@/lib/platform/automations"
import { apiError } from "@/lib/api/errors"
import type { AutomationActionType, AutomationConditionType, AutomationStep, AutomationTriggerType, SocialPlatform } from "@/types"

const stepSchema = z.object({ type: z.string(), label: z.string(), value: z.string().optional() })
const rulesSchema = z.object({
  runMode: z.enum(["manual-approval", "automatic"]),
  workingHoursOnly: z.boolean(),
  delayMinutes: z.number().int().min(0).max(1440),
  maxAttempts: z.number().int().min(1).max(10),
  escalateAfterFailures: z.boolean(),
  assignedTo: z.string().optional(),
})

const createSchema = z.object({
  name: z.string().trim().min(1).max(200),
  platform: z.string(),
  trigger: stepSchema,
  condition: stepSchema,
  action: stepSchema,
  rules: rulesSchema,
})

export async function GET() {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const roleCheck = requireRole(auth.ctx, ["owner", "admin", "manager"])
    if (roleCheck) return roleCheck

    const automations = await listAutomations(auth.ctx.workspaceId)
    return NextResponse.json({ automations })
  } catch (error) {
    return apiError(error, "Failed to load automations")
  }
}

export async function POST(request: Request) {
  const originCheck = verifySameOrigin(request)
  if (originCheck) return originCheck

  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const roleCheck = requireRole(auth.ctx, ["owner", "admin", "manager"])
    if (roleCheck) return roleCheck

    const body = createSchema.parse(await request.json())
    const automation = await createAutomation({
      workspaceId: auth.ctx.workspaceId,
      name: body.name,
      platform: body.platform as SocialPlatform | "all",
      trigger: body.trigger as AutomationStep<AutomationTriggerType>,
      condition: body.condition as AutomationStep<AutomationConditionType>,
      action: body.action as AutomationStep<AutomationActionType>,
      rules: body.rules,
    })

    return NextResponse.json({ automation }, { status: 201 })
  } catch (error) {
    return apiError(error, "Failed to create automation")
  }
}
