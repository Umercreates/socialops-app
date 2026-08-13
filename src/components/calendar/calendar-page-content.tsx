"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MonthView } from "@/components/calendar/month-view"
import { WeekView } from "@/components/calendar/week-view"
import { ListView } from "@/components/calendar/list-view"
import { PostDetailDialog } from "@/components/calendar/post-detail-dialog"
import { formatMonthLabel, formatDayLabel, getWeekDays } from "@/components/calendar/calendar-utils"
import { usePosts } from "@/lib/store/posts-store"
import { MOCK_NOW } from "@/lib/data/constants"
import type { Post } from "@/types"
import { cn } from "@/lib/utils"

type View = "month" | "week" | "list"

export function CalendarPageContent() {
  const { posts } = usePosts()
  const [view, setView] = React.useState<View>("month")
  const [anchor, setAnchor] = React.useState(new Date(MOCK_NOW))
  const [selectedPost, setSelectedPost] = React.useState<Post | null>(null)

  function step(direction: 1 | -1) {
    setAnchor((prev) => {
      const next = new Date(prev)
      if (view === "month") next.setUTCMonth(next.getUTCMonth() + direction)
      else if (view === "week") next.setUTCDate(next.getUTCDate() + direction * 7)
      else next.setUTCMonth(next.getUTCMonth() + direction)
      return next
    })
  }

  const rangeLabel =
    view === "month"
      ? formatMonthLabel(anchor)
      : view === "week"
        ? (() => {
            const days = getWeekDays(anchor)
            return `${formatDayLabel(days[0])} – ${formatDayLabel(days[6])}`
          })()
        : formatMonthLabel(anchor)

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 ease-out">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Content calendar</h2>
          <p className="text-sm text-muted-foreground">Every draft, scheduled, published, and failed post in one view.</p>
        </div>
        <Button render={<Link href="/dashboard/create" />} nativeButton={false}>
          <Plus />
          Create post
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="icon-sm" onClick={() => step(-1)} aria-label="Previous">
            <ChevronLeft />
          </Button>
          <span className="w-32 text-center text-sm font-medium text-foreground sm:w-44">{rangeLabel}</span>
          <Button variant="outline" size="icon-sm" onClick={() => step(1)} aria-label="Next">
            <ChevronRight />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setAnchor(new Date(MOCK_NOW))}>
            Today
          </Button>
        </div>

        <div className="inline-flex items-center gap-0.5 rounded-lg bg-muted p-0.5">
          {(["month", "week", "list"] as View[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setView(option)}
              className={cn(
                "h-7 rounded-md px-3 text-xs font-medium capitalize transition-colors",
                view === option ? "bg-card text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {view === "month" && <MonthView monthAnchor={anchor} posts={posts} today={MOCK_NOW} onSelectPost={setSelectedPost} />}
      {view === "week" && <WeekView weekAnchor={anchor} posts={posts} today={MOCK_NOW} onSelectPost={setSelectedPost} />}
      {view === "list" && <ListView posts={posts} onSelectPost={setSelectedPost} />}

      <PostDetailDialog post={selectedPost} onOpenChange={(open) => !open && setSelectedPost(null)} />
    </div>
  )
}
