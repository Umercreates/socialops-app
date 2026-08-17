import { randomUUID } from "node:crypto"
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises"
import path from "node:path"
import type { StorageAdapter, StoredFile } from "./adapter"

/**
 * Filesystem-backed StorageAdapter for this host, which has no object
 * storage service available. Files live under storage/media/ at the app
 * root - a sibling of migrations/, deliberately outside .next/ (wiped and
 * replaced by every deploy) and outside public/ (served directly, with no
 * auth check, by Next's built-in static handling) - so uploads survive
 * redeploys and are only ever reachable through the authenticated
 * /api/media/[id]/file route, never a guessable direct URL.
 *
 * The key this adapter returns is a relative path already scoped to a
 * workspace and randomly named - never derived from client input, so
 * there is nothing for a path-traversal attempt to reach: read()/delete()
 * only ever join it onto STORAGE_ROOT and resolve it, then verify the
 * result is still inside STORAGE_ROOT before touching the filesystem.
 */
const STORAGE_ROOT = path.join(process.cwd(), "storage", "media")

function resolveWithinRoot(key: string): string | null {
  const resolved = path.resolve(STORAGE_ROOT, key)
  if (resolved !== STORAGE_ROOT && !resolved.startsWith(STORAGE_ROOT + path.sep)) return null
  return resolved
}

class LocalStorageAdapter implements StorageAdapter {
  async save(workspaceId: string, buffer: Buffer, extension: string): Promise<StoredFile> {
    const dir = path.join(STORAGE_ROOT, workspaceId)
    await mkdir(dir, { recursive: true })
    const filename = `${randomUUID()}${extension}`
    const key = path.join(workspaceId, filename)
    const absolutePath = path.join(dir, filename)
    await writeFile(absolutePath, buffer, { mode: 0o644 })
    return { key, sizeBytes: buffer.byteLength }
  }

  async read(key: string): Promise<Buffer | null> {
    const absolutePath = resolveWithinRoot(key)
    if (!absolutePath) return null
    try {
      return await readFile(absolutePath)
    } catch {
      return null
    }
  }

  async delete(key: string): Promise<void> {
    const absolutePath = resolveWithinRoot(key)
    if (!absolutePath) return
    try {
      await unlink(absolutePath)
    } catch {
      // Already gone - deleting a missing file is not an error for a caller.
    }
  }
}

let cachedAdapter: StorageAdapter | null = null

/** Single seam for swapping in object storage later (S3-compatible, etc.)
 * without touching any caller - every route/handler in this app goes
 * through this function rather than importing LocalStorageAdapter
 * directly. */
export function getStorageAdapter(): StorageAdapter {
  if (!cachedAdapter) cachedAdapter = new LocalStorageAdapter()
  return cachedAdapter
}
