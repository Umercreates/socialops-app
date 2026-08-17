/**
 * Storage abstraction for user-uploaded media - kept separate from the
 * media_assets DB table (which is authoritative for what exists and who
 * owns it) so the actual bytes can move to object storage later without
 * touching any caller of this interface. `key` is opaque outside the
 * adapter that issued it; callers never construct or parse one themselves.
 */
export interface StoredFile {
  key: string
  sizeBytes: number
}

export interface StorageAdapter {
  /** Persists `buffer` under a server-generated key scoped to `workspaceId`.
   * `extension` must already be validated by the caller (derived from a
   * checked MIME type, never from client-supplied input) - this never
   * trusts a caller-provided filename or path. */
  save(workspaceId: string, buffer: Buffer, extension: string): Promise<StoredFile>
  /** Null if the key doesn't resolve to an existing file - never throws for
   * a missing file, since "not found" is an expected, non-exceptional
   * outcome for a caller (e.g. the retrieval route returning 404). */
  read(key: string): Promise<Buffer | null>
  delete(key: string): Promise<void>
}
