import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/guard"
import { getSyncSummary } from "@/lib/platform/google-sheets-sync"
import { apiError } from "@/lib/api/errors"

export async function GET() {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const summary = await getSyncSummary(auth.ctx.workspaceId)
    return NextResponse.json({ summary })
  } catch (error) {
    return apiError(error, "Failed to load sync summary")
  }
}
