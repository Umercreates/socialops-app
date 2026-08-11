"use client"

import { PlatformIcon } from "@/components/dashboard/platform-icon"
import { POST_STATUS_TONE } from "@/lib/post-status"
import { cn } from "@/lib/utils"
import type { Post } from "@/types"

const DOT_CLASS: Record<string, string> = {
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-destructive",
  info: "bg-brand",
  neutral: "bg-muted-foreground",
}

interface PostChipProps {
  post: Post
  onClick: () => void
  time?: string
}

export function PostChip({ post, onClick, time }: PostChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-1.5 rounded-md bg-muted/70 px-1.5 py-1 text-left text-[11px] text-foreground hover:bg-muted"
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", DOT_CLASS[POST_STATUS_TONE[post.status]])} />
      {time && <span className="shrink-0 text-muted-foreground tabular-nums">{time}</span>}
      <span className="flex shrink-0 -space-x-1">
        {post.platforms.slice(0, 2).map((platform) => (
          <PlatformIcon key={platform} platform={platform} size={11} className="text-muted-foreground" />
        ))}
      </span>
      <span className="truncate">{post.title}</span>
    </button>
  )
}
