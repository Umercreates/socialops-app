"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MonthView } from "@/components/calendar/month-view"
import { WeekView } from "@/components/calendar/week-view"
import { ListView } from "@/components/calendar/list-view"
import { PostDetailDialog } from "@/components/calendar/post-detail-dialog"
import { formatMonthLabel, formatDayLabel, getWeekDays } from "@/components/calendar/calendar-utils"
import type { Post } from "@/types"
import { cn } from "@/lib/utils"

type View = "month" | "week" | "list"

export function CalendarPageContent() {
  const [posts, setPosts] = React.useState<Post[] | null>(null)
  const [now] = React.useState(() => new Date())
  const [view, setView] = React.useState<View>("month")
  const [anchor, setAnchor] = React.useState(now)
  const [selectedPost, setSelectedPost] = React.useState<Post | null>(null)

  React.useEffect(() => {
    let cancelled = false
    fetch("/api/posts", { credentials: "same-origin" })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setPosts(data.posts ?? [])
      })
      .catch(() => {
        if (!cancelled) setPosts([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function deletePost(id: string) {
    setPosts((prev) => prev?.filter((p) => p.id !== id) ?? null)
    await fetch(`/api/posts/${id}`, { method: "DELETE", credentials: "same-origin" }).catch(() => {})
  }

  async function reschedulePost(id: string, iso: string) {
    const res = await fetch(`/api/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ status: "scheduled", scheduledFor: iso }),
    })
    const data = await res.json()
    if (res.ok) setPosts((prev) => prev?.map((p) => (p.id === id ? data.post : p)) ?? null)
  }

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
          <Button variant="ghost" size="sm" onClick={() => setAnchor(now)}>
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

      {!posts ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading...
        </div>
      ) : (
        <>
          {view === "month" && <MonthView monthAnchor={anchor} posts={posts} today={now} onSelectPost={setSelectedPost} />}
          {view === "week" && <WeekView weekAnchor={anchor} posts={posts} today={now} onSelectPost={setSelectedPost} />}
          {view === "list" && <ListView posts={posts} onSelectPost={setSelectedPost} />}
        </>
      )}

      <PostDetailDialog
        post={selectedPost}
        onOpenChange={(open) => !open && setSelectedPost(null)}
        onDelete={deletePost}
        onReschedule={reschedulePost}
      />
    </div>
  )
}
