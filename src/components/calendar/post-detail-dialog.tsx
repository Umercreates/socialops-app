"use client"

import * as React from "react"
import { CalendarClock, Trash2, Eye, Heart, MessageSquare, Repeat2, Users } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PlatformIcon, PLATFORM_LABEL } from "@/components/dashboard/platform-icon"
import { PostThumbnail } from "@/components/dashboard/post-thumbnail"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { ScheduleDialog } from "@/components/composer/schedule-dialog"
import { POST_STATUS_TONE, POST_STATUS_LABEL } from "@/lib/post-status"
import { formatCompactNumber } from "@/lib/format"
import type { Post } from "@/types"

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(iso))
}

interface PostDetailDialogProps {
  post: Post | null
  onOpenChange: (open: boolean) => void
  onDelete: (id: string) => void
  onReschedule: (id: string, iso: string) => void
}

export function PostDetailDialog({ post, onOpenChange, onDelete, onReschedule }: PostDetailDialogProps) {
  const [rescheduleOpen, setRescheduleOpen] = React.useState(false)

  if (!post) return null

  return (
    <>
      <Dialog open={Boolean(post) && !rescheduleOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle className="flex-1">{post.title}</DialogTitle>
              <StatusBadge tone={POST_STATUS_TONE[post.status]}>{POST_STATUS_LABEL[post.status]}</StatusBadge>
            </div>
            <DialogDescription>
              {post.status === "scheduled" && post.scheduledFor && `Scheduled for ${formatDateTime(post.scheduledFor)}`}
              {post.status === "published" && post.publishedAt && `Published ${formatDateTime(post.publishedAt)}`}
              {post.status === "draft" && "Not yet scheduled"}
              {post.status === "failed" && (post.failureReason ?? "Publishing failed")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-3">
            <PostThumbnail media={post.media} seed={post.id} className="size-20 shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <p className="line-clamp-4 text-sm text-foreground">{post.baseCaption || "No caption"}</p>
              <div className="flex flex-wrap gap-1.5">
                {post.platforms.map((platform) => (
                  <span
                    key={platform}
                    className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    <PlatformIcon platform={platform} size={12} />
                    {PLATFORM_LABEL[platform]}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {post.analytics && (
            <div className="grid grid-cols-5 gap-2 rounded-lg bg-muted/50 px-3 py-2.5">
              <Stat icon={Users} label="Reach" value={formatCompactNumber(post.analytics.reach)} />
              <Stat icon={Eye} label="Views" value={formatCompactNumber(post.analytics.views)} />
              <Stat icon={Heart} label="Likes" value={formatCompactNumber(post.analytics.likes)} />
              <Stat icon={MessageSquare} label="Comments" value={formatCompactNumber(post.analytics.comments)} />
              <Stat icon={Repeat2} label="Shares" value={formatCompactNumber(post.analytics.shares)} />
            </div>
          )}

          <DialogFooter className="!mt-0 flex-row flex-wrap items-center justify-between gap-2 sm:justify-between">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  onDelete(post.id)
                  onOpenChange(false)
                }}
              >
                <Trash2 />
                Delete
              </Button>
            </div>
            {(post.status === "scheduled" || post.status === "failed") && (
              <Button size="sm" onClick={() => setRescheduleOpen(true)}>
                <CalendarClock />
                {post.status === "failed" ? "Reschedule" : "Reschedule"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ScheduleDialog
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        onConfirm={(iso) => {
          onReschedule(post.id, iso)
          setRescheduleOpen(false)
          onOpenChange(false)
        }}
      />
    </>
  )
}

function Stat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 text-center">
      <Icon className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
      <span className="text-[13px] font-semibold text-foreground">{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  )
}

