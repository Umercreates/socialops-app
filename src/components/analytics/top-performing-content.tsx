"use client"

import { PlatformIcon } from "@/components/dashboard/platform-icon"
import { PostThumbnail } from "@/components/dashboard/post-thumbnail"
import { formatCompactNumber } from "@/lib/format"
import type { PlatformFilterValue } from "@/components/dashboard/platform-filter"
import type { Post } from "@/types"

interface TopPerformingContentProps {
  posts: Post[]
  platformFilter: PlatformFilterValue
}

export function TopPerformingContent({ posts, platformFilter }: TopPerformingContentProps) {
  const filtered = posts.filter((p) => platformFilter === "all" || p.platforms.includes(platformFilter))

  if (filtered.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No published content for this platform yet.</p>
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      {filtered.map((post) => (
        <div key={post.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
          <PostThumbnail media={post.media} seed={post.id} className="size-10 shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm text-foreground">{post.title}</span>
            <span className="flex items-center gap-1">
              {post.platforms.map((platform) => (
                <PlatformIcon key={platform} platform={platform} accent size={11} />
              ))}
            </span>
          </div>
          <div className="hidden shrink-0 gap-4 text-right text-xs text-muted-foreground sm:flex">
            <span>{formatCompactNumber(post.analytics?.reach ?? 0)} reach</span>
            <span>{formatCompactNumber(post.analytics?.views ?? 0)} views</span>
            <span>{formatCompactNumber(post.analytics?.likes ?? 0)} likes</span>
          </div>
          <span className="shrink-0 text-sm font-medium tabular-nums text-success">{post.analytics?.engagementRate ?? 0}%</span>
        </div>
      ))}
    </div>
  )
}
