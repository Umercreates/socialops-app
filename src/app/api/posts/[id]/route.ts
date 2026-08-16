import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth, requireRole } from "@/lib/auth/guard"
import { verifySameOrigin } from "@/lib/auth/csrf"
import { getPost, updatePost, deletePost, listPostTargets, createPostTargets } from "@/lib/platform/posts"
import { getSocialAccountsByIds } from "@/lib/platform/social-accounts"
import { enqueueJob } from "@/lib/jobs/queue"
import { apiError } from "@/lib/api/errors"

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const { id } = await ctx.params
    const post = await getPost(auth.ctx.workspaceId, id, auth.ctx.userName)
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 })

    const targets = await listPostTargets(auth.ctx.workspaceId, id)
    return NextResponse.json({ post, targets })
  } catch (error) {
    return apiError(error, "Failed to load post")
  }
}

const mediaSchema = z.object({ id: z.string(), type: z.enum(["image", "video"]), url: z.string(), name: z.string() })
const variantSchema = z.object({
  platform: z.string(),
  enabled: z.boolean(),
  caption: z.string(),
  hashtags: z.string(),
  title: z.string().optional(),
  firstComment: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  link: z.string().optional(),
})

const patchSchema = z
  .object({
    title: z.string().trim().max(200),
    baseCaption: z.string().max(5000),
    baseHashtags: z.string().max(1000),
    media: z.array(mediaSchema).max(20),
    platforms: z.array(z.string()).max(10),
    variants: z.array(variantSchema).max(10),
    status: z.enum(["draft", "scheduled", "publishing", "published", "partially_failed", "failed"]),
    scheduledFor: z.string().datetime().nullable(),
    /** Present only when rescheduling/republishing needs to (re-)enqueue
     * jobs against a fresh or changed set of connected accounts. */
    accountIds: z.array(z.string().uuid()).max(20),
  })
  .partial()

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const originCheck = verifySameOrigin(request)
  if (originCheck) return originCheck

  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const roleCheck = requireRole(auth.ctx, ["owner", "admin", "manager"])
    if (roleCheck) return roleCheck

    const { id } = await ctx.params
    const body = patchSchema.parse(await request.json())
    const { accountIds, ...patch } = body

    const post = await updatePost(auth.ctx.workspaceId, id, patch as Parameters<typeof updatePost>[2])
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 })

    // Rescheduling/republishing with a (re)selected account list creates
    // fresh targets and jobs for this round - existing target history from
    // a prior attempt is left alone, since it's a real record of what
    // already happened, not something a reschedule should erase.
    if (accountIds && accountIds.length > 0 && (body.status === "scheduled" || body.status === "publishing")) {
      const accounts = await getSocialAccountsByIds(auth.ctx.workspaceId, accountIds)
      const targets = await createPostTargets(
        auth.ctx.workspaceId,
        id,
        accounts.map((a) => ({ socialAccountId: a.id, provider: a.provider }))
      )
      const availableAt = body.status === "scheduled" && body.scheduledFor ? new Date(body.scheduledFor) : new Date()
      await Promise.all(
        targets.map((target) =>
          enqueueJob({
            workspaceId: auth.ctx.workspaceId,
            type: "publish_post",
            payload: { postId: id, targetId: target.id },
            availableAt,
            maxAttempts: 3,
          })
        )
      )
    }

    return NextResponse.json({ post })
  } catch (error) {
    return apiError(error, "Failed to update post")
  }
}

export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const originCheck = verifySameOrigin(request)
  if (originCheck) return originCheck

  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const roleCheck = requireRole(auth.ctx, ["owner", "admin", "manager"])
    if (roleCheck) return roleCheck

    const { id } = await ctx.params
    await deletePost(auth.ctx.workspaceId, id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return apiError(error, "Failed to delete post")
  }
}
