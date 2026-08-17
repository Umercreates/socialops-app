import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth, requireRole } from "@/lib/auth/guard"
import { verifySameOrigin } from "@/lib/auth/csrf"
import { resolveActiveConnection } from "@/lib/integrations/credential-resolution"
import { upsertConnection } from "@/lib/integrations/repository"
import { apiError } from "@/lib/api/errors"

/** Which Google Calendar this workspace books meetings on - stored on the
 * existing google-calendar connection row (config.calendarId/
 * calendarName/timezone), same pattern as the Facebook Page selection. */
export async function GET() {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const { row } = await resolveActiveConnection(auth.ctx.workspaceId, "google-calendar")
    const calendarId = row?.config?.calendarId
    if (typeof calendarId !== "string") return NextResponse.json({ selection: null })
    return NextResponse.json({
      selection: {
        calendarId,
        calendarName: typeof row?.config?.calendarName === "string" ? row.config.calendarName : null,
        timezone: typeof row?.config?.timezone === "string" ? row.config.timezone : "UTC",
      },
    })
  } catch (error) {
    return apiError(error, "Failed to load calendar selection")
  }
}

const saveSchema = z.object({
  calendarId: z.string().trim().min(1),
  calendarName: z.string().trim().max(500).optional(),
  timezone: z.string().trim().min(1).max(100),
})

export async function PUT(request: Request) {
  const originCheck = verifySameOrigin(request)
  if (originCheck) return originCheck

  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const roleCheck = requireRole(auth.ctx, ["owner", "admin"])
    if (roleCheck) return roleCheck

    const body = saveSchema.parse(await request.json())
    const { live } = await resolveActiveConnection(auth.ctx.workspaceId, "google-calendar")
    if (!live) return NextResponse.json({ error: "Google Calendar isn't connected and activated for this workspace." }, { status: 400 })

    await upsertConnection({
      workspaceId: auth.ctx.workspaceId,
      provider: "google-calendar",
      config: { calendarId: body.calendarId, calendarName: body.calendarName ?? null, timezone: body.timezone },
    })

    return NextResponse.json({ selection: { calendarId: body.calendarId, calendarName: body.calendarName ?? null, timezone: body.timezone } })
  } catch (error) {
    return apiError(error, "Failed to save calendar selection")
  }
}
