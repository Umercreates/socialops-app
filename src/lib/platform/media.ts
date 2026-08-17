import { randomUUID } from "node:crypto"
import { and, eq } from "drizzle-orm"
import { withDb } from "@/lib/db/client"
import { mediaAssets } from "@/lib/db/schema"

export interface MediaAsset {
  id: string
  workspaceId: string
  storageKey: string
  mediaType: "image" | "video"
  mimeType: string
  sizeBytes: number
  originalFilename: string
  createdAt: string
}

function rowToAsset(row: typeof mediaAssets.$inferSelect): MediaAsset {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    storageKey: row.storageKey,
    mediaType: row.mediaType as "image" | "video",
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    originalFilename: row.originalFilename,
    createdAt: row.createdAt.toISOString(),
  }
}

export interface CreateMediaAssetInput {
  workspaceId: string
  storageKey: string
  mediaType: "image" | "video"
  mimeType: string
  sizeBytes: number
  originalFilename: string
  uploadedByUserId: string | null
}

export async function createMediaAsset(input: CreateMediaAssetInput): Promise<MediaAsset> {
  return withDb(async (db) => {
    const [row] = await db
      .insert(mediaAssets)
      .values({
        id: randomUUID(),
        workspaceId: input.workspaceId,
        storageKey: input.storageKey,
        mediaType: input.mediaType,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        originalFilename: input.originalFilename,
        uploadedByUserId: input.uploadedByUserId,
      })
      .returning()
    return rowToAsset(row)
  })
}

/** Always scoped to workspaceId - a media asset id alone is never enough
 * to read one, exactly like every other workspace-owned record in this
 * app (a lead, a post, a connection). */
export async function getMediaAsset(workspaceId: string, id: string): Promise<MediaAsset | null> {
  return withDb(async (db) => {
    const rows = await db.select().from(mediaAssets).where(and(eq(mediaAssets.id, id), eq(mediaAssets.workspaceId, workspaceId))).limit(1)
    return rows[0] ? rowToAsset(rows[0]) : null
  })
}

/** Unscoped lookup - exists only for the signed public-media route, where
 * a valid HMAC signature over this exact id is what proves the caller was
 * already authorized (by server code that itself checked workspace
 * ownership when it issued the signature), not a session's own
 * workspaceId. Never call this from a session-authenticated route - use
 * getMediaAsset there. */
export async function getMediaAssetById(id: string): Promise<MediaAsset | null> {
  return withDb(async (db) => {
    const rows = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1)
    return rows[0] ? rowToAsset(rows[0]) : null
  })
}

export async function deleteMediaAsset(workspaceId: string, id: string): Promise<void> {
  await withDb(async (db) => {
    await db.delete(mediaAssets).where(and(eq(mediaAssets.id, id), eq(mediaAssets.workspaceId, workspaceId)))
  })
}
