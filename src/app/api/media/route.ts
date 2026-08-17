import { NextResponse } from "next/server"
import { requireAuth, requireRole } from "@/lib/auth/guard"
import { verifySameOrigin } from "@/lib/auth/csrf"
import { validateUpload, MAX_UPLOAD_BYTES } from "@/lib/storage/media-validation"
import { getStorageAdapter } from "@/lib/storage/local-adapter"
import { createMediaAsset } from "@/lib/platform/media"
import { apiError } from "@/lib/api/errors"

/** Persists a Composer-attached image/video to server-side storage so a
 * later publishing job can actually read its bytes - browser object URLs
 * (the previous approach) only ever exist in that one browser tab. */
export async function POST(request: Request) {
  const originCheck = verifySameOrigin(request)
  if (originCheck) return originCheck

  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const roleCheck = requireRole(auth.ctx, ["owner", "admin", "manager"])
    if (roleCheck) return roleCheck

    // Rejects an oversized request from its Content-Length header before
    // request.formData() ever buffers the body into memory - on a 1GB host,
    // there's no reason to read a multi-hundred-MB request just to reject
    // it after the fact. A small multipart-overhead margin above the
    // largest real upload type's own cap avoids false rejections.
    const declaredLength = Number(request.headers.get("content-length") ?? 0)
    if (declaredLength > MAX_UPLOAD_BYTES + 1024 * 1024) {
      return NextResponse.json({ error: "File is too large." }, { status: 413 })
    }

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
