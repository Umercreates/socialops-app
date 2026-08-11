"use client"

import { PlatformIcon } from "@/components/dashboard/platform-icon"
import { PostThumbnail } from "@/components/dashboard/post-thumbnail"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { POST_STATUS_TONE, POST_STATUS_LABEL } from "@/lib/post-status"
import { dateKeyFor } from "@/components/calendar/calendar-utils"
import type { Post } from "@/types"

function timelineIso(post: Post) {
  return post.status === "published" ? post.publishedAt : post.status === "draft" ? post.createdAt : post.scheduledFor
}

function formatGroupLabel(dateKey: string) {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }).format(
    new Date(`${dateKey}T00:00:00Z`)
  )
}

function formatTime(iso?: string) {
  if (!iso) return ""
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(new Date(iso))
}

interface ListViewProps {
  posts: Post[]
  onSelectPost: (post: Post) => void
}

export function ListView({ posts, onSelectPost }: ListViewProps) {
  const sorted = [...posts].sort((a, b) => (timelineIso(a) ?? "").localeCompare(timelineIso(b) ?? ""))
  const groups = new Map<string, Post[]>()
  for (const post of sorted) {
    const key = dateKeyFor(post)
    if (!key) continue
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(post)
  }

  if (groups.size === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
        No content in this range.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {Array.from(groups.entries()).map(([key, groupPosts]) => (
        <div key={key} className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground">{formatGroupLabel(key)}</span>
          <div className="flex flex-col divide-y divide-border rounded-xl bg-card ring-1 ring-foreground/10">
            {groupPosts.map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => onSelectPost(post)}
                className="flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50"
              >
                <PostThumbnail media={post.media} seed={post.id} className="size-10 shrink-0" />
                <span className="w-14 shrink-0 text-xs tabular-nums text-muted-foreground">{formatTime(timelineIso(post))}</span>
                <span className="flex shrink-0 -space-x-1">
                  {post.platforms.map((platform) => (
                    <span key={platform} className="flex size-5 items-center justify-center rounded-full bg-muted ring-1 ring-card">
                      <PlatformIcon platform={platform} accent size={11} />
                    </span>
                  ))}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">{post.title}</span>
                <StatusBadge tone={POST_STATUS_TONE[post.status]} className="shrink-0">
                  {POST_STATUS_LABEL[post.status]}
                </StatusBadge>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
