"use client"

import * as React from "react"
import { ImagePlus, X as XIcon, Film, Loader2 } from "lucide-react"
import type { PostMedia } from "@/types"
import { cn } from "@/lib/utils"

interface MediaUploaderProps {
  media: PostMedia[]
  onChange: (media: PostMedia[]) => void
  onUploadingChange?: (uploading: boolean) => void
}

const MAX_FILES = 6

/** Each attached file uploads to /api/media immediately on selection - the
 * item appears right away using a local object URL for instant preview,
 * then swaps to the real /api/media/{id}/file URL (and gains
 * mediaAssetId) once the upload finishes. A failed upload removes its
 * item and surfaces the server's reason rather than leaving a
 * never-publishable placeholder in the post. */
export function MediaUploader({ media, onChange, onUploadingChange }: MediaUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [uploadingIds, setUploadingIds] = React.useState<Set<string>>(new Set())
  const [error, setError] = React.useState<string | null>(null)
  const mediaRef = React.useRef(media)
  React.useEffect(() => {
    mediaRef.current = media
  }, [media])

  React.useEffect(() => {
    onUploadingChange?.(uploadingIds.size > 0)
  }, [uploadingIds, onUploadingChange])

  async function uploadOne(item: PostMedia, file: File) {
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/media", { method: "POST", credentials: "same-origin", body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Upload failed")

      if (item.url.startsWith("blob:")) URL.revokeObjectURL(item.url)
      onChange(mediaRef.current.map((m) => (m.id === item.id ? { ...m, url: data.url, mediaAssetId: data.id } : m)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
      onChange(mediaRef.current.filter((m) => m.id !== item.id))
    } finally {
      setUploadingIds((prev) => {
        const next = new Set(prev)
        next.delete(item.id)
        return next
      })
    }
  }

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    setError(null)
    const room = MAX_FILES - media.length
    const files = Array.from(fileList).slice(0, Math.max(room, 0))
    const next: PostMedia[] = files.map((file) => ({
      id: `media_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: file.type.startsWith("video") ? "video" : "image",
      url: URL.createObjectURL(file),
      name: file.name,
    }))
    onChange([...media, ...next])
    setUploadingIds((prev) => new Set([...prev, ...next.map((m) => m.id)]))
    next.forEach((item, i) => uploadOne(item, files[i]))
  }

  function removeMedia(id: string) {
    const target = media.find((m) => m.id === id)
    if (target && target.url.startsWith("blob:")) URL.revokeObjectURL(target.url)
    onChange(media.filter((m) => m.id !== id))
  }

  return (
    <div className="flex flex-col gap-2.5">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime"
        multiple
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files)
          event.target.value = ""
        }}
      />

      {media.length === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            handleFiles(event.dataTransfer.files)
          }}
          className={cn(
            "flex h-36 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-ring/50 hover:text-foreground"
          )}
        >
          <ImagePlus className="size-5" strokeWidth={1.75} />
          <span className="text-sm font-medium">Click or drop images/video</span>
          <span className="text-xs text-muted-foreground/70">JPG, PNG, WebP, GIF, MP4, MOV — up to 6 files</span>
        </button>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {media.map((item) => (
            <div key={item.id} className="group relative aspect-square overflow-hidden rounded-lg bg-muted ring-1 ring-border">
              {item.type === "video" ? (
                <video src={item.url} className="size-full object-cover" muted />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt={item.name} className="size-full object-cover" />
              )}
              {uploadingIds.has(item.id) && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Loader2 className="size-4 animate-spin text-white" />
                </span>
              )}
              {item.type === "video" && (
                <span className="absolute bottom-1 left-1 flex size-4 items-center justify-center rounded bg-black/60 text-white">
                  <Film className="size-2.5" />
                </span>
              )}
              <button
                type="button"
                onClick={() => removeMedia(item.id)}
                className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Remove media"
              >
                <XIcon className="size-3" />
              </button>
            </div>
          ))}
          {media.length < MAX_FILES && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-ring/50 hover:text-foreground"
              aria-label="Add more media"
            >
              <ImagePlus className="size-4" strokeWidth={1.75} />
            </button>
          )}
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
