import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/guard"
import { apiError } from "@/lib/api/errors"

export async function GET() {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    return NextResponse.json({
      user: { id: auth.ctx.userId, name: auth.ctx.userName, email: auth.ctx.userEmail, role: auth.ctx.role },
      workspace: { id: auth.ctx.workspaceId, name: auth.ctx.workspaceName },
    })
  } catch (error) {
    return apiError(error, "Failed to load session")
  }
}
