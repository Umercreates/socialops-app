import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth, requireRole } from "@/lib/auth/guard"
import { verifySameOrigin } from "@/lib/auth/csrf"
import { getCommentRow, updateCommentStatus, recordCommentReply } from "@/lib/platform/comments"
import { resolveActiveConnection } from "@/lib/integrations/credential-resolution"
import { resolveCredentialValue } from "@/lib/integrations/service"
import { replyToFacebookComment } from "@/lib/integrations/facebook/client"
import { replyToInstagramComment } from "@/lib/integrations/instagram/client"
import { apiError } from "@/lib/api/errors"

const replySchema = z.object({ message: z.string().trim().min(1).max(2000) })

/** Posts a real reply to a Facebook/Instagram comment through the Graph
 * API, then records it - never the reverse. Both providers reply using the
 * connected Page's own access token (Instagram comment moderation rides on
 * the linked Page, same as publishing). */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const originCheck = verifySameOrigin(request)
  if (originCheck) return originCheck

  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const roleCheck = requireRole(auth.ctx, ["owner", "admin", "manager", "sales"])
    if (roleCheck) return roleCheck

    const { id } = await ctx.params
    const comment = await getCommentRow(auth.ctx.workspaceId, id)
    if (!comment) return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    if (!comment.externalCommentId) {
      return NextResponse.json({ error: "This comment has no provider id to reply to." }, { status: 400 })
    }
    if (comment.provider !== "facebook" && comment.provider !== "instagram") {
      return NextResponse.json({ error: `Replying isn't supported for ${comment.provider} yet.` }, { status: 400 })
    }

    const body = replySchema.parse(await request.json())

    const { live, row } = await resolveActiveConnection(auth.ctx.workspaceId, "facebook")
    if (!live) {
      return NextResponse.json({ error: "Facebook isn't connected and activated for this workspace. Configure it in Integrations." }, { status: 400 })
    }
    const { value: pageAccessToken } = resolveCredentialValue(row, "pageAccessToken", "facebook")
    const pageName = typeof row?.config?.pageName === "string" ? row.config.pageName : "Page"
    if (!pageAccessToken) {
      return NextResponse.json({ error: "No Facebook Page selected - choose a Page in Integrations first." }, { status: 400 })
    }

    const result =
      comment.provider === "facebook"
        ? await replyToFacebookComment(comment.externalCommentId, pageAccessToken, body.message)
        : await replyToInstagramComment(comment.externalCommentId, pageAccessToken, body.message)

    if (!result.ok || !result.replyId) {
      return NextResponse.json({ error: result.errorMessage ?? "Reply failed" }, { status: 502 })
    }

    const reply = await recordCommentReply({
      workspaceId: auth.ctx.workspaceId,
      parentCommentId: comment.id,
      socialAccountId: comment.socialAccountId,
      provider: comment.provider,
      externalPostId: comment.externalPostId,
      externalCommentId: result.replyId,
      authorName: pageName,
      body: body.message,
    })
    await updateCommentStatus(auth.ctx.workspaceId, comment.id, "resolved")

    return NextResponse.json({ reply }, { status: 201 })
  } catch (error) {
    return apiError(error, "Failed to send reply")
  }
}
