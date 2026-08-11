"use client"

import * as React from "react"
import { ImagePlus, X as XIcon, Film } from "lucide-react"
import type { PostMedia } from "@/types"
import { cn } from "@/lib/utils"

interface MediaUploaderProps {
  media: PostMedia[]
  onChange: (media: PostMedia[]) => void
}

export function MediaUploader({ media, onChange }: MediaUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    const next: PostMedia[] = Array.from(fileList).map((file) => ({
      id: `media_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: file.type.startsWith("video") ? "video" : "image",
      url: URL.createObjectURL(file),
      name: file.name,
    }))
    onChange([...media, ...next])
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
        accept="image/*,video/*"
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
          <span className="text-xs text-muted-foreground/70">PNG, JPG, MP4 — up to 6 files</span>
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
          {media.length < 6 && (
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
    </div>
  )
}
