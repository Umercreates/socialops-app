import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/guard"
import { listComments } from "@/lib/platform/comments"
import { apiError } from "@/lib/api/errors"

export async function GET() {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const comments = await listComments(auth.ctx.workspaceId)
    return NextResponse.json({ comments })
  } catch (error) {
    return apiError(error, "Failed to load comments")
  }
}
