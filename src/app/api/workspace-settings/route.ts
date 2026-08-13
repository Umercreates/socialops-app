import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth, requireRole } from "@/lib/auth/guard"
import { verifySameOrigin } from "@/lib/auth/csrf"
import { getWorkspaceSettings, updateWorkspaceSettings } from "@/lib/platform/workspace-settings"
import { apiError } from "@/lib/api/errors"

export async function GET() {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const settings = await getWorkspaceSettings(auth.ctx.workspaceId)
    return NextResponse.json({ settings })
  } catch (error) {
    return apiError(error, "Failed to load workspace settings")
  }
}

const patchSchema = z
  .object({
    timezone: z.string().trim().min(1).max(100),
    defaultLanguage: z.string().trim().min(2).max(10),
    leadScoreThreshold: z.number().int().min(0).max(100),
    humanHandoffRules: z.record(z.string(), z.unknown()),
    notificationPreferences: z.record(z.string(), z.unknown()),
  })
  .partial()

export async function PATCH(request: Request) {
  const originCheck = verifySameOrigin(request)
  if (originCheck) return originCheck

  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const roleCheck = requireRole(auth.ctx, ["owner", "admin"])
    if (roleCheck) return roleCheck

    const patch = patchSchema.parse(await request.json())
    const settings = await updateWorkspaceSettings(auth.ctx.workspaceId, patch)
    return NextResponse.json({ settings })
  } catch (error) {
    return apiError(error, "Failed to update workspace settings")
  }
}
