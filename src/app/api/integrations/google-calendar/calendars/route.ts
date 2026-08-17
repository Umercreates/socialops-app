import { NextResponse } from "next/server"
import { requireAuth, requireRole } from "@/lib/auth/guard"
import { resolveActiveConnection } from "@/lib/integrations/credential-resolution"
import { resolveCredentialValue } from "@/lib/integrations/service"
import { listCalendars } from "@/lib/integrations/google-calendar/client"
import { apiError } from "@/lib/api/errors"

/** Discovers calendars in the workspace's connected Google account - the
 * client picks from here rather than pasting a calendar ID. */
export async function GET() {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const roleCheck = requireRole(auth.ctx, ["owner", "admin"])
    if (roleCheck) return roleCheck

    const { live, row } = await resolveActiveConnection(auth.ctx.workspaceId, "google-calendar")
    if (!live) {
      return NextResponse.json({ error: "Google Calendar isn't connected and activated for this workspace." }, { status: 400 })
    }
    const { value: accessToken } = resolveCredentialValue(row, "accessToken", "google-calendar")
    if (!accessToken) {
      return NextResponse.json({ error: "No Google access token on file - reconnect Google in Integrations." }, { status: 400 })
    }

    const result = await listCalendars(accessToken)
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 })

    return NextResponse.json({ calendars: result.calendars })
  } catch (error) {
    return apiError(error, "Failed to list calendars")
  }
}
