import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth, requireRole } from "@/lib/auth/guard"
import { verifySameOrigin } from "@/lib/auth/csrf"
import { updateCommentStatus } from "@/lib/platform/comments"
import { apiError } from "@/lib/api/errors"

const patchSchema = z.object({ status: z.enum(["open", "resolved", "hidden"]) })

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const originCheck = verifySameOrigin(request)
  if (originCheck) return originCheck

  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const roleCheck = requireRole(auth.ctx, ["owner", "admin", "manager", "sales"])
    if (roleCheck) return roleCheck

    const { id } = await ctx.params
    const body = patchSchema.parse(await request.json())
    const comment = await updateCommentStatus(auth.ctx.workspaceId, id, body.status)
    if (!comment) return NextResponse.json({ error: "Comment not found" }, { status: 404 })

    return NextResponse.json({ comment })
  } catch (error) {
    return apiError(error, "Failed to update comment")
  }
}
