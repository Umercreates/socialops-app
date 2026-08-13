import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth, requireRole } from "@/lib/auth/guard"
import { verifySameOrigin } from "@/lib/auth/csrf"
import { listPosts, createPost } from "@/lib/platform/posts"
import { apiError } from "@/lib/api/errors"
import type { PostMedia, PostVariant, SocialPlatform } from "@/types"

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

const createSchema = z.object({
  title: z.string().trim().max(200).default(""),
  baseCaption: z.string().max(5000).default(""),
  baseHashtags: z.string().max(1000).default(""),
  media: z.array(mediaSchema).max(20).default([]),
  platforms: z.array(z.string()).max(10).default([]),
  variants: z.array(variantSchema).max(10).default([]),
  status: z.enum(["draft", "scheduled", "publishing", "published", "partially_failed", "failed"]).default("draft"),
  scheduledFor: z.string().datetime().optional(),
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

    const body = createSchema.parse(await request.json())
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

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    return apiError(error, "Failed to create post")
  }
}
