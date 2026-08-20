import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth, requireRole } from "@/lib/auth/guard"
import { verifySameOrigin } from "@/lib/auth/csrf"
import { requireClientMode } from "@/lib/auth/dashboard-mode-guard"
import { listPosts, createPost, createPostTargets } from "@/lib/platform/posts"
import { getSocialAccountsByIds } from "@/lib/platform/social-accounts"
import { enqueueJob } from "@/lib/jobs/queue"
import { apiError } from "@/lib/api/errors"
import type { PostMedia, PostVariant, SocialPlatform } from "@/types"

const mediaSchema = z.object({ id: z.string(), type: z.enum(["image", "video"]), url: z.string(), name: z.string(), mediaAssetId: z.string().uuid().optional() })
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

const createSchema = z.object({
  title: z.string().trim().max(200).default(""),
  baseCaption: z.string().max(5000).default(""),
  baseHashtags: z.string().max(1000).default(""),
  media: z.array(mediaSchema).max(20).default([]),
  platforms: z.array(z.string()).max(10).default([]),
  variants: z.array(variantSchema).max(10).default([]),
  status: z.enum(["draft", "scheduled", "publishing", "published", "partially_failed", "failed"]).default("draft"),
  scheduledFor: z.string().datetime().optional(),
  /** Specific connected social_accounts rows this post targets - never a
   * platform name alone, since that doesn't say which real account to
   * publish through. Draft posts may omit this (account selection can
   * happen later); scheduling or publishing now requires at least one. */
  accountIds: z.array(z.string().uuid()).max(20).default([]),
})

export async function GET() {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const posts = await listPosts(auth.ctx.workspaceId)
    return NextResponse.json({ posts })
  } catch (error) {
    return apiError(error, "Failed to load posts")
  }
}

export async function POST(request: Request) {
  const originCheck = verifySameOrigin(request)
  if (originCheck) return originCheck

  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const roleCheck = requireRole(auth.ctx, ["owner", "admin", "manager"])
    if (roleCheck) return roleCheck
    const modeCheck = await requireClientMode()
    if (modeCheck) return modeCheck

    const body = createSchema.parse(await request.json())

    if ((body.status === "scheduled" || body.status === "publishing") && body.accountIds.length === 0) {
      return NextResponse.json({ error: "Select at least one connected account to schedule or publish." }, { status: 400 })
    }

    // Never trust a client-supplied provider name for a target - resolve it
    // from the account record itself, and silently drop any id that isn't
    // actually a real account in this workspace (never invent a target).
    const accounts = await getSocialAccountsByIds(auth.ctx.workspaceId, body.accountIds)

    const post = await createPost({
      workspaceId: auth.ctx.workspaceId,
      authorUserId: auth.ctx.userId,
      authorName: auth.ctx.userName,
      title: body.title,
      baseCaption: body.baseCaption,
      baseHashtags: body.baseHashtags,
      media: body.media as PostMedia[],
      platforms: body.platforms as SocialPlatform[],
      variants: body.variants as PostVariant[],
      status: body.status,
      scheduledFor: body.scheduledFor,
    })

    if (accounts.length > 0) {
      const targets = await createPostTargets(
        auth.ctx.workspaceId,
        post.id,
        accounts.map((a) => ({ socialAccountId: a.id, provider: a.provider }))
      )

      if (body.status === "scheduled" || body.status === "publishing") {
        const availableAt = body.status === "scheduled" && body.scheduledFor ? new Date(body.scheduledFor) : new Date()
        await Promise.all(
          targets.map((target) =>
            enqueueJob({
              workspaceId: auth.ctx.workspaceId,
              type: "publish_post",
              payload: { postId: post.id, targetId: target.id },
              availableAt,
              maxAttempts: 3,
            })
          )
        )
      }
    }

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    return apiError(error, "Failed to create post")
  }
}
