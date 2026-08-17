/**
 * The single allowlist every upload path checks against - MIME type is
 * read from the actual multipart part's declared Content-Type, and the
 * on-disk extension is always taken from this table (never from the
 * client-supplied filename), so an upload can't smuggle an executable or
 * script in under an image/video MIME type or a spoofed extension.
 */
const ALLOWED_TYPES: Record<string, { extension: string; mediaType: "image" | "video"; maxBytes: number }> = {
  "image/jpeg": { extension: ".jpg", mediaType: "image", maxBytes: 8 * 1024 * 1024 },
  "image/png": { extension: ".png", mediaType: "image", maxBytes: 8 * 1024 * 1024 },
  "image/webp": { extension: ".webp", mediaType: "image", maxBytes: 8 * 1024 * 1024 },
  "image/gif": { extension: ".gif", mediaType: "image", maxBytes: 8 * 1024 * 1024 },
  "video/mp4": { extension: ".mp4", mediaType: "video", maxBytes: 100 * 1024 * 1024 },
  "video/quicktime": { extension: ".mov", mediaType: "video", maxBytes: 100 * 1024 * 1024 },
}

export interface MediaValidationResult {
  ok: boolean
  error?: string
  extension?: string
  mediaType?: "image" | "video"
}

export function validateUpload(mimeType: string, sizeBytes: number): MediaValidationResult {
  const rule = ALLOWED_TYPES[mimeType]
  if (!rule) return { ok: false, error: `Unsupported file type: ${mimeType || "unknown"}. Allowed: JPEG, PNG, WebP, GIF, MP4, MOV.` }
  if (sizeBytes <= 0) return { ok: false, error: "File is empty." }
  if (sizeBytes > rule.maxBytes) {
    return { ok: false, error: `File is too large (max ${Math.floor(rule.maxBytes / (1024 * 1024))}MB for this type).` }
  }
  return { ok: true, extension: rule.extension, mediaType: rule.mediaType }
}
