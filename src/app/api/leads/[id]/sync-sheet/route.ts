import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/guard"
import { verifySameOrigin } from "@/lib/auth/csrf"
import { syncLeadToSheet } from "@/lib/integrations/google-sheets/sync"
import { apiError } from "@/lib/api/errors"

/** Manual "sync this lead now" entry point - the same real sync the
 * add-sheet-row/update-sheet-row automation actions use, just triggered
 * by a person instead of an event. */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const originCheck = verifySameOrigin(request)
  if (originCheck) return originCheck

  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const { id } = await ctx.params
    const result = await syncLeadToSheet(auth.ctx.workspaceId, id)
    return NextResponse.json({ ok: result.status === "synced", status: result.status, message: result.errorMessage })
  } catch (error) {
    return apiError(error, "Failed to sync lead to Google Sheets")
  }
}
