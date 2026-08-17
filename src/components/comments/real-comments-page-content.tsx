"use client"

import * as React from "react"
import { Reply, EyeOff, CircleCheck, Loader2, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlatformIcon, PLATFORM_LABEL } from "@/components/dashboard/platform-icon"
import { PlatformFilter, type PlatformFilterValue } from "@/components/dashboard/platform-filter"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { formatRelativeTime } from "@/lib/format"
import type { Comment } from "@/types"
import { cn } from "@/lib/utils"

function initialsFor(name: string) {
  return name
    .split(/[.\s]/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

/**
 * Real Comments — Facebook/Instagram comments arrive via a Meta webhook
 * (see /api/webhooks/meta), so this is genuinely what customers wrote, not
 * a demo feed. Only actions with a real Graph API backing are offered:
 * Reply (posts through the Graph API), Resolve/Hide (status update). No
 * Like/Mark-Lead/DM buttons here - those had no real implementation behind
 * them in the demo version and this page doesn't pretend otherwise.
 */
export function RealCommentsPageContent() {
  const [comments, setComments] = React.useState<Comment[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [platformFilter, setPlatformFilter] = React.useState<PlatformFilterValue>("all")
  const [showResolved, setShowResolved] = React.useState(false)
  const [replyingId, setReplyingId] = React.useState<string | null>(null)
  const [replyDraft, setReplyDraft] = React.useState("")
  const [sending, setSending] = React.useState(false)
  const [actionError, setActionError] = React.useState<string | null>(null)

  const refreshComments = React.useCallback(async () => {
    try {
      const res = await fetch("/api/comments", { credentials: "same-origin" })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setComments(data.comments)
    } catch {
      setError("Couldn't load comments.")
    }
  }, [])

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      await refreshComments()
      if (!cancelled) setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [refreshComments])

  async function setStatus(id: string, status: "open" | "resolved" | "hidden") {
    setComments((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)))
    await fetch(`/api/comments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ status }),
    }).catch(() => null)
  }

  async function submitReply(id: string) {
    if (!replyDraft.trim()) return
    setSending(true)
    setActionError(null)
    try {
      const res = await fetch(`/api/comments/${id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ message: replyDraft.trim() }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setActionError(data?.error ?? "Couldn't send the reply.")
        return
      }
      setReplyingId(null)
      setReplyDraft("")
      await refreshComments()
    } catch {
      setActionError("Couldn't reach the server.")
    } finally {
      setSending(false)
    }
  }

  const visible = comments
    .filter((c) => c.status !== "hidden")
    .filter((c) => showResolved || c.status !== "resolved")
    .filter((c) => platformFilter === "all" || c.platform === platformFilter)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 ease-out">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Comments</h2>
        <p className="text-sm text-muted-foreground">
          Real Facebook and Instagram comments on your posts. Other platforms don&apos;t support comment ingestion yet.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowResolved((v) => !v)}
          className={cn(
            "h-7 shrink-0 rounded-md px-2.5 text-xs font-medium transition-colors",
            showResolved ? "bg-card text-foreground shadow-sm ring-1 ring-border" : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          {showResolved ? "Showing resolved" : "Hide resolved"}
        </button>
        <PlatformFilter value={platformFilter} onChange={setPlatformFilter} />
      </div>

      {actionError && <p className="text-xs text-destructive">{actionError}</p>}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading…
        </div>
      ) : error ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-16 text-center text-sm text-muted-foreground">{error}</div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-16 text-center">
          <MessageSquare className="size-5 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No comments yet.</p>
          <p className="max-w-sm text-xs text-muted-foreground/80">
            Comments appear here automatically once Facebook or Instagram is connected and someone comments on a post.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {visible.map((comment) => (
            <div key={comment.id} className="flex flex-col gap-2.5 rounded-xl bg-card p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-foreground/10">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  {initialsFor(comment.authorName)}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-medium text-foreground">{comment.authorName}</span>
                    {comment.authorHandle && <span className="text-xs text-muted-foreground">{comment.authorHandle}</span>}
                    <PlatformIcon platform={comment.platform} size={12} className="text-muted-foreground" />
                  </div>
                  <p className="text-sm text-foreground">{comment.body}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {comment.status === "resolved" && <StatusBadge tone="success">Replied</StatusBadge>}
                    <span className="text-xs text-muted-foreground">{formatRelativeTime(comment.createdAt, new Date())}</span>
                    <span className="text-xs text-muted-foreground">· on {PLATFORM_LABEL[comment.platform]}</span>
                  </div>
                </div>
              </div>

              {replyingId === comment.id && (
                <form
                  onSubmit={(event) => {
                    event.preventDefault()
                    submitReply(comment.id)
                  }}
                  className="flex items-center gap-2 pl-0 sm:pl-12"
                >
                  <Input
                    autoFocus
                    value={replyDraft}
                    onChange={(event) => setReplyDraft(event.target.value)}
                    placeholder={`Reply to ${comment.authorName}…`}
                    className="h-8 min-w-0 flex-1"
                    disabled={sending}
                  />
                  <Button type="submit" size="sm" disabled={!replyDraft.trim() || sending}>
                    {sending ? <Loader2 className="size-3.5 animate-spin" /> : "Send"}
                  </Button>
                </form>
              )}

              <div className="flex flex-wrap items-center gap-1 pl-0 sm:pl-12">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    setReplyingId(replyingId === comment.id ? null : comment.id)
                    setReplyDraft("")
                    setActionError(null)
                  }}
                >
                  <Reply className="size-3.5" />
                  Reply
                </Button>
                {comment.status !== "resolved" && (
                  <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setStatus(comment.id, "resolved")}>
                    <CircleCheck className="size-3.5" />
                    Mark resolved
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setStatus(comment.id, "hidden")}>
                  <EyeOff className="size-3.5" />
                  Hide
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
