import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth, requireRole } from "@/lib/auth/guard"
import { verifySameOrigin } from "@/lib/auth/csrf"
import { getGoogleSheetsSelection, saveGoogleSheetsSelection } from "@/lib/platform/google-sheets-selection"
import { apiError } from "@/lib/api/errors"

export async function GET() {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const selection = await getGoogleSheetsSelection(auth.ctx.workspaceId)
    return NextResponse.json({ selection })
  } catch (error) {
    return apiError(error, "Failed to load spreadsheet selection")
  }
}

const saveSchema = z.object({
  spreadsheetId: z.string().trim().min(1),
  spreadsheetName: z.string().trim().max(500).optional(),
  worksheetName: z.string().trim().min(1).max(200),
  columnMapping: z.record(z.string(), z.string()).default({}),
})

/** A client's workspace-scoped spreadsheet choice - the whole point of
 * this route is that saving one requires no source edit, .env edit, or
 * redeploy, just a normal authenticated API call. */
export async function PUT(request: Request) {
  const originCheck = verifySameOrigin(request)
  if (originCheck) return originCheck

  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const roleCheck = requireRole(auth.ctx, ["owner", "admin"])
    if (roleCheck) return roleCheck

    const body = saveSchema.parse(await request.json())
    const selection = await saveGoogleSheetsSelection({
      workspaceId: auth.ctx.workspaceId,
      spreadsheetId: body.spreadsheetId,
      spreadsheetName: body.spreadsheetName,
      worksheetName: body.worksheetName,
      columnMapping: body.columnMapping,
      selectedByUserId: auth.ctx.userId,
    })

    return NextResponse.json({ selection })
  } catch (error) {
    return apiError(error, "Failed to save spreadsheet selection")
  }
}
