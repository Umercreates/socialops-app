import { NextResponse } from "next/server"
import { requireAuth, requireRole } from "@/lib/auth/guard"
import { resolveActiveConnection } from "@/lib/integrations/credential-resolution"
import { resolveCredentialValue } from "@/lib/integrations/service"
import { listWorksheets } from "@/lib/integrations/google-sheets/client"
import { apiError } from "@/lib/api/errors"

/** Discovers worksheet tabs inside one spreadsheet the client has picked. */
export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const roleCheck = requireRole(auth.ctx, ["owner", "admin"])
    if (roleCheck) return roleCheck

    const { id } = await ctx.params
    const { live, row } = await resolveActiveConnection(auth.ctx.workspaceId, "google-sheets")
    if (!live) {
      return NextResponse.json({ error: "Google Sheets isn't connected and activated for this workspace." }, { status: 400 })
    }
    const { value: accessToken } = resolveCredentialValue(row, "accessToken", "google-sheets")
    if (!accessToken) {
      return NextResponse.json({ error: "No Google access token on file - reconnect Google in Integrations." }, { status: 400 })
    }

    const result = await listWorksheets(accessToken, id)
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 })

    return NextResponse.json({ spreadsheetName: result.spreadsheetName, worksheets: result.worksheets })
  } catch (error) {
    return apiError(error, "Failed to list worksheets")
  }
}
