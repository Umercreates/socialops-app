"use client"

import * as React from "react"
import { PlatformIcon } from "@/components/dashboard/platform-icon"
import { PostThumbnail } from "@/components/dashboard/post-thumbnail"
import { PlatformFilter, type PlatformFilterValue } from "@/components/dashboard/platform-filter"
import { PostDetailDialog } from "@/components/calendar/post-detail-dialog"
import { formatCompactNumber } from "@/lib/format"
import { usePosts } from "@/lib/store/posts-store"
import type { Post } from "@/types"

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(iso))
}

/** Demo Mode Published Posts - same UI as the real page, backed by the
 * demo posts store (which already carries realistic engagement numbers
 * for its seed posts, unlike the real backend which has none yet). */
export function DemoPublishedPostsContent() {
  const { posts, removePost, updatePost } = usePosts()
  const [platformFilter, setPlatformFilter] = React.useState<PlatformFilterValue>("all")
  const [selectedPost, setSelectedPost] = React.useState<Post | null>(null)

  const published = posts
    .filter((p) => p.status === "published")
    .filter((p) => platformFilter === "all" || p.platforms.includes(platformFilter))
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))

  const totals = published.reduce(
    (acc, p) => {
      if (!p.analytics) return acc
      acc.reach += p.analytics.reach
      acc.views += p.analytics.views
      acc.likes += p.analytics.likes
      return acc
    },
    { reach: 0, views: 0, likes: 0 }
  )

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 ease-out">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Published posts</h2>
          <p className="text-sm text-muted-foreground">
            {published.length} shown · {formatCompactNumber(totals.reach)} combined reach · {formatCompactNumber(totals.views)} views · Demo workspace
          </p>
        </div>
        <PlatformFilter value={platformFilter} onChange={setPlatformFilter} />
      </div>

      {published.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-16 text-center text-sm text-muted-foreground">
          No published posts for this filter yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
          <div className="min-w-[860px]">
            <div className="grid grid-cols-[minmax(0,2.2fr)_repeat(6,minmax(0,0.85fr))] gap-2 border-b border-border bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
              <span>Post</span>
              <span className="text-right">Reach</span>
              <span className="text-right">Views</span>
              <span className="text-right">Likes</span>
              <span className="text-right">Comments</span>
              <span className="text-right">Shares</span>
              <span className="text-right">Eng. rate</span>
            </div>
            <div className="flex flex-col divide-y divide-border">
              {published.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => setSelectedPost(post)}
                  className="grid grid-cols-[minmax(0,2.2fr)_repeat(6,minmax(0,0.85fr))] items-center gap-2 px-3 py-2.5 text-left hover:bg-muted/40"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <PostThumbnail media={post.media} seed={post.id} className="size-9 shrink-0" />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm text-foreground">{post.title}</span>
                      <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="flex -space-x-1">
                          {post.platforms.map((platform) => (
                            <PlatformIcon key={platform} platform={platform} accent size={11} />
                          ))}
                        </span>
                        {post.publishedAt && formatDate(post.publishedAt)}
                      </span>
                    </span>
                  </span>
                  <span className="text-right text-sm tabular-nums text-foreground">{formatCompactNumber(post.analytics?.reach ?? 0)}</span>
                  <span className="text-right text-sm tabular-nums text-foreground">{formatCompactNumber(post.analytics?.views ?? 0)}</span>
                  <span className="text-right text-sm tabular-nums text-foreground">{formatCompactNumber(post.analytics?.likes ?? 0)}</span>
                  <span className="text-right text-sm tabular-nums text-foreground">{formatCompactNumber(post.analytics?.comments ?? 0)}</span>
                  <span className="text-right text-sm tabular-nums text-foreground">{formatCompactNumber(post.analytics?.shares ?? 0)}</span>
                  <span className="text-right text-sm font-medium tabular-nums text-success">{post.analytics?.engagementRate ?? 0}%</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <PostDetailDialog
        post={selectedPost}
        onOpenChange={(open) => !open && setSelectedPost(null)}
        onDelete={(id) => removePost(id)}
        onReschedule={(id, iso) => updatePost(id, { status: "scheduled", scheduledFor: iso })}
      />
    </div>
  )
}
