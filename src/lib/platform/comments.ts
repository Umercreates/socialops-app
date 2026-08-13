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
