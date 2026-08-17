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

export async function getPost(workspaceId: string, id: string, authorName = ""): Promise<Post | null> {
  return withDb(async (db) => {
    const rows = await db.select().from(posts).where(and(eq(posts.id, id), eq(posts.workspaceId, workspaceId))).limit(1)
    const row = rows[0]
    return row ? rowToPost(row, authorName, row.authorUserId ?? "") : null
  })
}

export interface UpdatePostInput {
  title?: string
  baseCaption?: string
  baseHashtags?: string
  media?: PostMedia[]
  platforms?: SocialPlatform[]
  variants?: PostVariant[]
  status?: PostStatus
  scheduledFor?: string | null
}

export async function updatePost(workspaceId: string, id: string, patch: UpdatePostInput): Promise<Post | null> {
  return withDb(async (db) => {
    const [row] = await db
      .update(posts)
      .set({
        ...patch,
        scheduledFor: patch.scheduledFor === undefined ? undefined : patch.scheduledFor ? new Date(patch.scheduledFor) : null,
        updatedAt: new Date(),
      })
      .where(and(eq(posts.id, id), eq(posts.workspaceId, workspaceId)))
      .returning()
    return row ? rowToPost(row, "", row.authorUserId ?? "") : null
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
): Promise<{ id: string; socialAccountId: string; provider: string }[]> {
  if (targets.length === 0) return []
  return withDb(async (db) => {
    const rows = await db
      .insert(postTargets)
      .values(
        targets.map((t) => ({
          id: randomUUID(),
          postId,
          workspaceId,
          socialAccountId: t.socialAccountId,
          provider: t.provider,
        }))
      )
      .returning({ id: postTargets.id, socialAccountId: postTargets.socialAccountId, provider: postTargets.provider })
    return rows
  })
}

export interface PostTargetRow {
  id: string
  postId: string
  workspaceId: string
  socialAccountId: string
  provider: string
  status: string
  externalPostId: string | null
  errorMessage: string | null
  publishedAt: string | null
}

export async function listPostTargets(workspaceId: string, postId: string): Promise<PostTargetRow[]> {
  return withDb(async (db) => {
    const rows = await db.select().from(postTargets).where(and(eq(postTargets.postId, postId), eq(postTargets.workspaceId, workspaceId)))
    return rows.map((r) => ({ ...r, publishedAt: r.publishedAt?.toISOString() ?? null }))
  })
}

export async function getPostTarget(id: string): Promise<PostTargetRow | null> {
  return withDb(async (db) => {
    const rows = await db.select().from(postTargets).where(eq(postTargets.id, id)).limit(1)
    const row = rows[0]
    return row ? { ...row, publishedAt: row.publishedAt?.toISOString() ?? null } : null
  })
}

export async function markPostTargetResult(
  targetId: string,
  result: { status: "published" | "failed" | "blocked" | "processing"; externalPostId?: string; errorMessage?: string }
): Promise<void> {
  await withDb(async (db) => {
    await db
      .update(postTargets)
      .set({
        status: result.status,
        externalPostId: result.externalPostId,
        errorMessage: result.errorMessage,
        publishedAt: result.status === "published" ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(postTargets.id, targetId))
  })
}

export async function setPostStatus(workspaceId: string, postId: string, status: PostStatus): Promise<void> {
  await withDb(async (db) => {
    await db
      .update(posts)
      .set({ status, publishedAt: status === "published" ? new Date() : undefined, updatedAt: new Date() })
      .where(and(eq(posts.id, postId), eq(posts.workspaceId, workspaceId)))
  })
}

/** Rolls a post's overall status up from its per-target results once every
 * target has reached a terminal state - all published, all failed/blocked
 * (failed), or a mix (partially_failed). Never called before every target
 * is terminal, since "publishing" is itself a valid, honest in-progress
 * state. */
export async function recomputePostStatus(workspaceId: string, postId: string): Promise<void> {
  const targets = await listPostTargets(workspaceId, postId)
  if (targets.length === 0) return
  const allTerminal = targets.every((t) => t.status === "published" || t.status === "failed" || t.status === "blocked")
  if (!allTerminal) return

  const allPublished = targets.every((t) => t.status === "published")
  const allFailed = targets.every((t) => t.status === "failed" || t.status === "blocked")
  const status: PostStatus = allPublished ? "published" : allFailed ? "failed" : "partially_failed"
  await setPostStatus(workspaceId, postId, status)
}
