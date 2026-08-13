"use client"

import { PostChip } from "@/components/calendar/post-chip"
import { getWeekDays, isSameDay, dateKeyFor, dateKey, formatDayLabel } from "@/components/calendar/calendar-utils"
import { cn } from "@/lib/utils"
import type { Post } from "@/types"

function timeFor(post: Post) {
  const iso = post.status === "published" ? post.publishedAt : post.status === "draft" ? post.createdAt : post.scheduledFor
  if (!iso) return undefined
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(new Date(iso))
}

interface WeekViewProps {
  weekAnchor: Date
  posts: Post[]
  today: Date
  onSelectPost: (post: Post) => void
}

export function WeekView({ weekAnchor, posts, today, onSelectPost }: WeekViewProps) {
  const days = getWeekDays(weekAnchor)
  const postsByDate = new Map<string, Post[]>()
  for (const post of posts) {
    const key = dateKeyFor(post)
    if (!key) continue
    if (!postsByDate.has(key)) postsByDate.set(key, [])
    postsByDate.get(key)!.push(post)
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
      {days.map((day) => {
        const dayPosts = (postsByDate.get(dateKey(day)) ?? []).sort((a, b) => (timeFor(a) ?? "").localeCompare(timeFor(b) ?? ""))
        const isToday = isSameDay(day, today)
        return (
          <div key={dateKey(day)} className="flex flex-col gap-2 rounded-xl bg-card p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-foreground/10">
            <div className="flex items-center justify-between">
              <span className={cn("text-xs font-medium", isToday ? "text-brand" : "text-muted-foreground")}>
                {formatDayLabel(day)}
              </span>
              {isToday && <span className="rounded-full bg-brand/10 px-1.5 py-0.5 text-[10px] font-medium text-brand">Today</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              {dayPosts.length === 0 ? (
                <span className="py-4 text-center text-[11px] text-muted-foreground/60">Nothing planned</span>
              ) : (
                dayPosts.map((post) => <PostChip key={post.id} post={post} time={timeFor(post)} onClick={() => onSelectPost(post)} />)
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
