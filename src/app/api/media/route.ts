import { NextResponse } from "next/server"
import { requireAuth, requireRole } from "@/lib/auth/guard"
import { validateUpload } from "@/lib/storage/media-validation"
import { getStorageAdapter } from "@/lib/storage/local-adapter"
import { createMediaAsset } from "@/lib/platform/media"
import { apiError } from "@/lib/api/errors"

/** Persists a Composer-attached image/video to server-side storage so a
 * later publishing job can actually read its bytes - browser object URLs
 * (the previous approach) only ever exist in that one browser tab. */
export async function POST(request: Request) {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const roleCheck = requireRole(auth.ctx, ["owner", "admin", "manager"])
    if (roleCheck) return roleCheck

    const form = await request.formData().catch(() => null)
    const file = form?.get("file")
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const validation = validateUpload(file.type, buffer.byteLength)
    if (!validation.ok || !validation.extension || !validation.mediaType) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const stored = await getStorageAdapter().save(auth.ctx.workspaceId, buffer, validation.extension)
    const asset = await createMediaAsset({
      workspaceId: auth.ctx.workspaceId,
      storageKey: stored.key,
      mediaType: validation.mediaType,
      mimeType: file.type,
      sizeBytes: stored.sizeBytes,
      originalFilename: file.name.slice(0, 255),
      uploadedByUserId: auth.ctx.userId,
    })

    return NextResponse.json({
      id: asset.id,
      url: `/api/media/${asset.id}/file`,
      mediaType: asset.mediaType,
      originalFilename: asset.originalFilename,
    })
  } catch (error) {
    return apiError(error, "Upload failed")
  }
}
