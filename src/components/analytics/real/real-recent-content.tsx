import { PlatformIcon } from "@/components/dashboard/platform-icon"
import { PostThumbnail } from "@/components/dashboard/post-thumbnail"
import { StatusBadge } from "@/components/dashboard/status-badge"
import type { PlatformFilterValue } from "@/components/dashboard/platform-filter"
import type { Post, SocialPlatform } from "@/types"

interface RealRecentContentProps {
  posts: Post[]
  platformFilter: PlatformFilterValue
}

function formatPublishedAt(iso?: string) {
  if (!iso) return ""
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(iso))
}

/** Real "recently published" list — the honest replacement for "Top
 * performing content", which ranked posts by fabricated engagement
 * numbers. No provider analytics API is integrated yet, so this shows
 * what actually happened (published where, when) instead of inventing a
 * performance ranking. */
export function RealRecentContent({ posts, platformFilter }: RealRecentContentProps) {
  const filtered = posts
    .filter((p) => p.status === "published")
    .filter((p) => platformFilter === "all" || p.platforms.includes(platformFilter))
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
    .slice(0, 8)

  if (filtered.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No published content for this platform yet.</p>
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      {filtered.map((post) => (
        <div key={post.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
          <PostThumbnail media={post.media} seed={post.id} className="size-10 shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm text-foreground">{post.title || "Untitled post"}</span>
            <span className="flex items-center gap-1">
              {(post.platforms as SocialPlatform[]).map((platform) => (
                <PlatformIcon key={platform} platform={platform} accent size={11} />
              ))}
            </span>
          </div>
          <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">{formatPublishedAt(post.publishedAt)}</span>
          <StatusBadge tone="success" className="shrink-0">
            Published
          </StatusBadge>
        </div>
      ))}
    </div>
  )
}
