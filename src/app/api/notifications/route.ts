import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/guard"
import { listNotifications } from "@/lib/platform/notifications"
import { apiError } from "@/lib/api/errors"

export async function GET() {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const notifications = await listNotifications(auth.ctx.workspaceId, auth.ctx.userId)
    return NextResponse.json({ notifications })
  } catch (error) {
    return apiError(error, "Failed to load notifications")
  }
}
