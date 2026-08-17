import { NextResponse } from "next/server"
import { requireAuth, requireRole } from "@/lib/auth/guard"
import { verifySameOrigin } from "@/lib/auth/csrf"
import { cancelMeeting } from "@/lib/integrations/google-calendar/booking"
import { apiError } from "@/lib/api/errors"

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const originCheck = verifySameOrigin(request)
  if (originCheck) return originCheck

  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const roleCheck = requireRole(auth.ctx, ["owner", "admin", "manager"])
    if (roleCheck) return roleCheck

    const { id } = await ctx.params
    const result = await cancelMeeting(auth.ctx.workspaceId, id)
    if (result.status === "failed") return NextResponse.json({ error: result.errorMessage }, { status: 502 })
    return NextResponse.json({ status: result.status })
  } catch (error) {
    return apiError(error, "Failed to cancel meeting")
  }
}
