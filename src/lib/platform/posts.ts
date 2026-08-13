import { randomUUID } from "node:crypto"
import { and, eq } from "drizzle-orm"
import { withDb } from "@/lib/db/client"
import { posts, postTargets } from "@/lib/db/schema"
import type { Post, PostStatus, PostMedia, PostVariant, SocialPlatform } from "@/types"

function rowToPost(row: typeof posts.$inferSelect, authorName: string, authorId: string): Post {
  return {
    id: row.id,
    title: row.title,
    status: row.status as PostStatus,
    baseCaption: row.baseCaption,
    baseHashtags: row.baseHashtags,
    media: row.media as PostMedia[],
    platforms: row.platforms as SocialPlatform[],
    variants: row.variants as PostVariant[],
    scheduledFor: row.scheduledFor?.toISOString(),
    publishedAt: row.publishedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    author: { id: authorId, name: authorName },
  }
}

export async function listPosts(workspaceId: string): Promise<Post[]> {
  return withDb(async (db) => {
    const rows = await db.select().from(posts).where(eq(posts.workspaceId, workspaceId))
    // Author name isn't denormalized onto the row - callers needing it for
    // display can join against users separately; the list view uses a
    // placeholder id-only author here to avoid an N+1 join for now.
    return rows.map((row) => rowToPost(row, "", row.authorUserId ?? ""))
  })
}

export interface CreatePostInput {
  workspaceId: string
  authorUserId: string
  authorName: string
  title: string
  baseCaption: string
  baseHashtags: string
  media: PostMedia[]
  platforms: SocialPlatform[]
  variants: PostVariant[]
  status: PostStatus
  scheduledFor?: string
}

export async function createPost(input: CreatePostInput): Promise<Post> {
  return withDb(async (db) => {
    const [row] = await db
      .insert(posts)
      .values({
        id: randomUUID(),
        workspaceId: input.workspaceId,
        authorUserId: input.authorUserId,
        title: input.title,
        status: input.status,
        baseCaption: input.baseCaption,
        baseHashtags: input.baseHashtags,
        media: input.media,
        platforms: input.platforms,
        variants: input.variants,
        scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : null,
      })
      .returning()
    return rowToPost(row, input.authorName, input.authorUserId)
  })
}

export async function deletePost(workspaceId: string, id: string): Promise<void> {
  await withDb(async (db) => {
    await db.delete(posts).where(and(eq(posts.id, id), eq(posts.workspaceId, workspaceId)))
  })
}

/** Creates one post_targets row per platform the post targets - each
 * platform's publish result is tracked independently, so one platform
 * failing never marks the whole post failed. Requires a matching
 * social_accounts row per platform (never invents one). */
export async function createPostTargets(
  workspaceId: string,
  postId: string,
  targets: { socialAccountId: string; provider: string }[]
): Promise<void> {
  if (targets.length === 0) return
  await withDb(async (db) => {
    await db.insert(postTargets).values(
      targets.map((t) => ({
        id: randomUUID(),
        postId,
        workspaceId,
        socialAccountId: t.socialAccountId,
        provider: t.provider,
      }))
    )
  })
}
