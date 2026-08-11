"use client"

import { PostChip } from "@/components/calendar/post-chip"
import { getMonthGrid, isSameDay, dateKeyFor, dateKey } from "@/components/calendar/calendar-utils"
import { cn } from "@/lib/utils"
import type { Post } from "@/types"

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

interface MonthViewProps {
  monthAnchor: Date
  posts: Post[]
  today: Date
  onSelectPost: (post: Post) => void
}

export function MonthView({ monthAnchor, posts, today, onSelectPost }: MonthViewProps) {
  const weeks = getMonthGrid(monthAnchor.getUTCFullYear(), monthAnchor.getUTCMonth())
  const postsByDate = new Map<string, Post[]>()
  for (const post of posts) {
    const key = dateKeyFor(post)
    if (!key) continue
    if (!postsByDate.has(key)) postsByDate.set(key, [])
    postsByDate.get(key)!.push(post)
  }

  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
      <div className="grid grid-cols-7 border-b border-border bg-muted/40">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="px-2 py-2 text-center text-xs font-medium text-muted-foreground">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {weeks.map((week, weekIndex) =>
          week.map((day, dayIndex) => {
            const inMonth = day.getUTCMonth() === monthAnchor.getUTCMonth()
            const dayPosts = postsByDate.get(dateKey(day)) ?? []
            const isToday = isSameDay(day, today)
            return (
              <div
                key={`${weekIndex}-${dayIndex}`}
                className={cn(
                  "flex min-h-24 flex-col gap-1 border-b border-r border-border p-1.5 last:border-r-0",
                  dayIndex === 6 && "border-r-0",
                  !inMonth && "bg-muted/20"
                )}
              >
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full text-xs",
                    isToday ? "bg-brand font-semibold text-brand-foreground" : inMonth ? "text-foreground" : "text-muted-foreground/50"
                  )}
                >
                  {day.getUTCDate()}
                </span>
                <div className="flex flex-col gap-1">
                  {dayPosts.slice(0, 3).map((post) => (
                    <PostChip key={post.id} post={post} onClick={() => onSelectPost(post)} />
                  ))}
                  {dayPosts.length > 3 && (
                    <span className="px-1 text-[10px] text-muted-foreground">+{dayPosts.length - 3} more</span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
