import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/guard"
import { listAutomationRuns } from "@/lib/platform/automations"
import { apiError } from "@/lib/api/errors"

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const { id } = await ctx.params
    const runs = await listAutomationRuns(auth.ctx.workspaceId, id)
    return NextResponse.json({ runs })
  } catch (error) {
    return apiError(error, "Failed to load automation runs")
  }
}
