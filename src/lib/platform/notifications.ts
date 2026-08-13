import { randomUUID } from "node:crypto"
import { and, eq, or, isNull, desc } from "drizzle-orm"
import { withDb } from "@/lib/db/client"
import { notifications } from "@/lib/db/schema"
import type { Notification, NotificationType } from "@/types"

function rowToNotification(row: typeof notifications.$inferSelect): Notification {
  return {
    id: row.id,
    type: row.type as NotificationType,
    title: row.title,
    description: row.description,
    createdAt: row.createdAt.toISOString(),
    read: row.readAt !== null,
  }
}

/** Lists notifications visible to this user: workspace-wide ones (userId
 * null) plus any addressed specifically to them. */
export async function listNotifications(workspaceId: string, userId: string, limit = 50): Promise<Notification[]> {
  return withDb(async (db) => {
    const rows = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.workspaceId, workspaceId), or(isNull(notifications.userId), eq(notifications.userId, userId))))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
    return rows.map(rowToNotification)
  })
}

export interface CreateNotificationInput {
  workspaceId: string
  userId?: string | null
  type: NotificationType
  title: string
  description?: string
  link?: string
}

export async function createNotification(input: CreateNotificationInput): Promise<Notification> {
  return withDb(async (db) => {
    const [row] = await db
      .insert(notifications)
      .values({
        id: randomUUID(),
        workspaceId: input.workspaceId,
        userId: input.userId ?? null,
        type: input.type,
        title: input.title,
        description: input.description ?? "",
        link: input.link,
      })
      .returning()
    return rowToNotification(row)
  })
}

export async function markNotificationRead(workspaceId: string, id: string): Promise<void> {
  await withDb(async (db) => {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.workspaceId, workspaceId)))
  })
}
