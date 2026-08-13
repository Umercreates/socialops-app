import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/guard"
import { verifySameOrigin } from "@/lib/auth/csrf"
import { markNotificationRead } from "@/lib/platform/notifications"
import { apiError } from "@/lib/api/errors"

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const originCheck = verifySameOrigin(request)
  if (originCheck) return originCheck

  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const { id } = await ctx.params
    await markNotificationRead(auth.ctx.workspaceId, id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return apiError(error, "Failed to update notification")
  }
}
