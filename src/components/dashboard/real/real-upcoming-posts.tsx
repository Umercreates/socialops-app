import Link from "next/link"
import { ArrowRight, CalendarClock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlatformIcon } from "@/components/dashboard/platform-icon"
import { StatusBadge } from "@/components/dashboard/status-badge"
import type { Post, SocialPlatform } from "@/types"

function formatScheduledFor(iso: string) {
  const date = new Date(iso)
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date)
}

export function RealUpcomingPosts({ posts }: { posts: Post[] }) {
  const scheduled = posts
    .filter((post) => post.status === "scheduled")
    .sort((a, b) => (a.scheduledFor ?? "").localeCompare(b.scheduledFor ?? ""))
  const preview = scheduled.slice(0, 5)

  return (
    <Card className="gap-3 px-4 py-4 sm:px-5 sm:py-5">
      <CardHeader className="flex-row items-center justify-between px-0">
        <CardTitle className="text-[15px]">Upcoming scheduled posts</CardTitle>
        <Link
          href="/dashboard/scheduled"
          prefetch={false}
          className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          View all {scheduled.length}
          <ArrowRight className="size-3" />
        </Link>
      </CardHeader>
      <CardContent className="px-0">
        {preview.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <CalendarClock className="size-5 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Nothing scheduled yet.</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {preview.map((post) => (
              <div key={post.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="flex -space-x-1.5">
                  {(post.platforms as SocialPlatform[]).map((platform) => (
                    <span key={platform} className="flex size-7 items-center justify-center rounded-full bg-muted ring-2 ring-card">
                      <PlatformIcon platform={platform} accent size={13} />
                    </span>
                  ))}
                </div>
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">{post.title}</span>
                <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                  {post.scheduledFor && formatScheduledFor(post.scheduledFor)}
                </span>
                <StatusBadge tone="info" className="shrink-0">
                  Scheduled
                </StatusBadge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
