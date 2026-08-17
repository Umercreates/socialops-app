import { randomUUID } from "node:crypto"
import { and, eq } from "drizzle-orm"
import { withDb } from "@/lib/db/client"
import { comments } from "@/lib/db/schema"
import type { Comment, CommentSentiment, CommentStatus, SocialPlatform } from "@/types"

function rowToComment(row: typeof comments.$inferSelect): Comment {
  return {
    id: row.id,
    platform: row.provider as SocialPlatform,
    postExcerpt: row.postExcerpt ?? "",
    postThumbnailColor: "#6366f1",
    authorName: row.authorName,
    authorHandle: row.authorHandle ?? "",
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    sentiment: row.sentiment as CommentSentiment,
    status: row.status as CommentStatus,
    likedByMe: false,
    markedAsLead: row.markedAsLead,
    whatsappCtaSentAt: row.whatsappCtaSentAt?.toISOString(),
    dmSentAt: row.dmSentAt?.toISOString(),
  }
}

export async function listComments(workspaceId: string, limit = 100): Promise<Comment[]> {
  return withDb(async (db) => {
    const rows = await db.select().from(comments).where(eq(comments.workspaceId, workspaceId)).limit(limit)
    return rows.map(rowToComment)
  })
}

export async function updateCommentStatus(workspaceId: string, id: string, status: CommentStatus): Promise<Comment | null> {
  return withDb(async (db) => {
    const [row] = await db
      .update(comments)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(comments.id, id), eq(comments.workspaceId, workspaceId)))
      .returning()
    return row ? rowToComment(row) : null
  })
}

export async function getComment(workspaceId: string, id: string): Promise<Comment | null> {
  return withDb(async (db) => {
    const rows = await db.select().from(comments).where(and(eq(comments.id, id), eq(comments.workspaceId, workspaceId))).limit(1)
    return rows[0] ? rowToComment(rows[0]) : null
  })
}

/** Internal row shape (includes fields the public Comment type doesn't
 * surface, like socialAccountId) - the webhook needs this to resolve which
 * Page/IG account access token to reply with. */
export async function getCommentRow(workspaceId: string, id: string) {
  return withDb(async (db) => {
    const rows = await db.select().from(comments).where(and(eq(comments.id, id), eq(comments.workspaceId, workspaceId))).limit(1)
    return rows[0] ?? null
  })
}

export interface IngestCommentInput {
  workspaceId: string
  socialAccountId: string | null
  provider: string
  externalPostId?: string | null
  externalCommentId: string
  postExcerpt?: string | null
  authorName: string
  authorHandle?: string | null
  body: string
}

/** Records a real inbound comment from a provider webhook. Returns null if
 * this externalCommentId was already recorded for this provider - the
 * caller's cue to skip (idempotency), same pattern as WhatsApp's
 * insertInboundMessageIfNew. */
export async function ingestComment(input: IngestCommentInput): Promise<Comment | null> {
  return withDb(async (db) => {
    const existing = await db
      .select({ id: comments.id })
      .from(comments)
      .where(and(eq(comments.workspaceId, input.workspaceId), eq(comments.provider, input.provider), eq(comments.externalCommentId, input.externalCommentId)))
      .limit(1)
    if (existing[0]) return null

    const [row] = await db
      .insert(comments)
      .values({
        id: randomUUID(),
        workspaceId: input.workspaceId,
        socialAccountId: input.socialAccountId,
        provider: input.provider,
        externalPostId: input.externalPostId ?? null,
        externalCommentId: input.externalCommentId,
        postExcerpt: input.postExcerpt ?? null,
        authorName: input.authorName,
        authorHandle: input.authorHandle ?? null,
        body: input.body,
      })
      .returning()
    return rowToComment(row)
  })
}

/** Records our own reply as a new comment row linked via parentCommentId -
 * only called after a real Graph API reply has actually succeeded (see
 * /api/comments/[id]/reply), never before, so this table never claims a
 * reply exists that wasn't actually posted. */
export async function recordCommentReply(input: {
  workspaceId: string
  parentCommentId: string
  socialAccountId: string | null
  provider: string
  externalPostId: string | null
  externalCommentId: string
  authorName: string
  body: string
}): Promise<Comment> {
  return withDb(async (db) => {
    const [row] = await db
      .insert(comments)
      .values({
        id: randomUUID(),
        workspaceId: input.workspaceId,
        socialAccountId: input.socialAccountId,
        provider: input.provider,
        externalPostId: input.externalPostId,
        externalCommentId: input.externalCommentId,
        parentCommentId: input.parentCommentId,
        authorName: input.authorName,
        body: input.body,
        status: "resolved",
      })
      .returning()
    return rowToComment(row)
  })
}
