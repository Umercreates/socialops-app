import { NextResponse } from "next/server"
import { requireAuth, requireRole } from "@/lib/auth/guard"
import { resolveActiveConnection } from "@/lib/integrations/credential-resolution"
import { resolveCredentialValue } from "@/lib/integrations/service"
import { listSpreadsheets } from "@/lib/integrations/google-sheets/client"
import { apiError } from "@/lib/api/errors"

/** Discovers spreadsheets in the workspace's connected Google account -
 * the client picks from here rather than pasting a spreadsheet ID. */
export async function GET() {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const roleCheck = requireRole(auth.ctx, ["owner", "admin"])
    if (roleCheck) return roleCheck

    const { live, row } = await resolveActiveConnection(auth.ctx.workspaceId, "google-sheets")
    if (!live) {
      return NextResponse.json({ error: "Google Sheets isn't connected and activated for this workspace." }, { status: 400 })
    }
    const { value: accessToken } = resolveCredentialValue(row, "accessToken", "google-sheets")
    if (!accessToken) {
      return NextResponse.json({ error: "No Google access token on file - reconnect Google in Integrations." }, { status: 400 })
    }

    const result = await listSpreadsheets(accessToken)
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 })

    return NextResponse.json({ spreadsheets: result.spreadsheets })
  } catch (error) {
    return apiError(error, "Failed to list spreadsheets")
  }
}
