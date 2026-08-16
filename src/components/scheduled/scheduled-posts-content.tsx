"use client"

import * as React from "react"
import Link from "next/link"
import { Pencil, CalendarClock, Trash2, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PlatformIcon } from "@/components/dashboard/platform-icon"
import { PostThumbnail } from "@/components/dashboard/post-thumbnail"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { PlatformFilter, type PlatformFilterValue } from "@/components/dashboard/platform-filter"
import { ScheduleDialog } from "@/components/composer/schedule-dialog"
import { EditPostDialog } from "@/components/scheduled/edit-post-dialog"
import { POST_STATUS_TONE, POST_STATUS_LABEL } from "@/lib/post-status"
import type { Post, PostStatus } from "@/types"
import { cn } from "@/lib/utils"

type StatusFilter = "all" | "scheduled" | "failed"

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(iso))
}
function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(new Date(iso))
}

export function ScheduledPostsContent() {
  const [posts, setPosts] = React.useState<Post[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [platformFilter, setPlatformFilter] = React.useState<PlatformFilterValue>("all")
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all")
  const [editingPost, setEditingPost] = React.useState<Post | null>(null)
  const [reschedulingPost, setReschedulingPost] = React.useState<Post | null>(null)

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/posts", { credentials: "same-origin" })
        if (!res.ok) throw new Error("Failed to load posts")
        const data = await res.json()
        if (!cancelled) setPosts(data.posts)
      } catch {
        if (!cancelled) setError("Couldn't load scheduled posts. Try refreshing.")
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function patchPost(id: string, patch: Record<string, unknown>) {
    const res = await fetch(`/api/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(patch),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? "That update failed.")
      return
    }
    setPosts((prev) => prev?.map((p) => (p.id === id ? data.post : p)) ?? null)
  }

  async function removePost(id: string) {
    const previous = posts
    setPosts((prev) => prev?.filter((p) => p.id !== id) ?? null)
    try {
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE", credentials: "same-origin" })
      if (!res.ok) throw new Error("Delete failed")
    } catch {
      setPosts(previous ?? null)
      setError("Couldn't delete that post. Try again.")
    }
  }

  const base = posts?.filter((p): p is Post & { status: "scheduled" | "failed" } => p.status === "scheduled" || p.status === "failed") ?? []
  const filtered = base
    .filter((p) => statusFilter === "all" || p.status === statusFilter)
    .filter((p) => platformFilter === "all" || p.platforms.includes(platformFilter))
    .sort((a, b) => {
      const aKey = a.status === "scheduled" ? a.scheduledFor ?? "" : a.createdAt
      const bKey = b.status === "scheduled" ? b.scheduledFor ?? "" : b.createdAt
      return aKey.localeCompare(bKey)
    })

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 ease-out">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Scheduled posts</h2>
          <p className="text-sm text-muted-foreground">
            {base.filter((p) => p.status === "scheduled").length} scheduled · {base.filter((p) => p.status === "failed").length} failed
          </p>
        </div>
        <Button render={<Link href="/dashboard/create" />} nativeButton={false}>
          <Plus />
          Create post
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-0.5 rounded-lg bg-muted p-0.5">
          {(["all", "scheduled", "failed"] as StatusFilter[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setStatusFilter(option)}
              className={cn(
                "h-7 rounded-md px-2.5 text-xs font-medium capitalize transition-colors",
                statusFilter === option ? "bg-card text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option}
            </button>
          ))}
        </div>
        <PlatformFilter value={platformFilter} onChange={setPlatformFilter} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!posts ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-16 text-center text-sm text-muted-foreground">
          Nothing matches these filters.
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-xl bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-foreground/10">
          {filtered.map((post) => {
            const dateIso = post.status === "scheduled" ? post.scheduledFor : post.createdAt
            return (
              <div key={post.id} className="flex flex-wrap items-center gap-3 px-3 py-3 sm:flex-nowrap">
                <PostThumbnail media={post.media} seed={post.id} className="size-11 shrink-0" />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-sm font-medium text-foreground">{post.title}</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex -space-x-1">
                      {post.platforms.map((platform) => (
                        <span key={platform} className="flex size-5 items-center justify-center rounded-full bg-muted ring-1 ring-card">
                          <PlatformIcon platform={platform} accent size={11} />
                        </span>
                      ))}
                    </span>
                    {post.status === "failed" && post.failureReason && (
                      <span className="truncate text-xs text-destructive">{post.failureReason}</span>
                    )}
                  </div>
                </div>
                {dateIso && (
                  <div className="flex shrink-0 flex-col items-end text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{formatDate(dateIso)}</span>
                    <span>{formatTime(dateIso)}</span>
                  </div>
                )}
                <StatusBadge tone={POST_STATUS_TONE[post.status as PostStatus]} className="shrink-0">
                  {POST_STATUS_LABEL[post.status as PostStatus]}
                </StatusBadge>
                <div className="flex shrink-0 items-center gap-1">
                  <Button variant="ghost" size="icon-sm" aria-label="Edit" onClick={() => setEditingPost(post)}>
                    <Pencil />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label="Reschedule" onClick={() => setReschedulingPost(post)}>
                    <CalendarClock />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removePost(post.id)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <EditPostDialog
        post={editingPost}
        onOpenChange={(open) => !open && setEditingPost(null)}
        onSave={(id, patch) => patchPost(id, patch)}
      />
      <ScheduleDialog
        open={Boolean(reschedulingPost)}
        onOpenChange={(open) => !open && setReschedulingPost(null)}
        onConfirm={(iso) => {
          if (reschedulingPost) {
            patchPost(reschedulingPost.id, { status: "scheduled", scheduledFor: iso })
          }
          setReschedulingPost(null)
        }}
      />
    </div>
  )
}
