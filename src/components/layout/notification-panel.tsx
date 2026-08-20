"use client"

import * as React from "react"
import {
  Bell,
  MessageCircle,
  MessageSquare,
  CircleCheck,
  CircleAlert,
  TriangleAlert,
  Workflow,
  PhoneCall,
  type LucideIcon,
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { formatRelativeTime } from "@/lib/format"
import { useDemoMode } from "@/lib/demo-mode-context"
import { NOTIFICATIONS } from "@/lib/data/notifications"
import type { Notification, NotificationType } from "@/types"
import { cn } from "@/lib/utils"

const TYPE_ICON: Record<NotificationType, LucideIcon> = {
  message: MessageCircle,
  comment: MessageSquare,
  "publish-success": CircleCheck,
  "publish-failed": CircleAlert,
  "account-warning": TriangleAlert,
  automation: Workflow,
  "call-completed": PhoneCall,
}

const TYPE_TONE: Record<NotificationType, string> = {
  message: "bg-brand/10 text-brand",
  comment: "bg-brand/10 text-brand",
  "publish-success": "bg-success/10 text-success",
  "publish-failed": "bg-destructive/10 text-destructive",
  "account-warning": "bg-warning/15 text-warning-foreground dark:text-warning",
  automation: "bg-muted text-muted-foreground",
  "call-completed": "bg-success/10 text-success",
}

/** Fetches its own data client-side instead of receiving it as a
 * server-rendered prop - the notification bell is not on any page's
 * critical rendering path, so a real-mode dashboard load never blocks on
 * this. Demo mode uses the static demo feed directly (unchanged behavior,
 * not a live fetch). */
export function NotificationPanel() {
  const demoMode = useDemoMode()
  const [notifications, setNotifications] = React.useState<Notification[]>(demoMode ? NOTIFICATIONS : [])
  const [loaded, setLoaded] = React.useState(demoMode)
  const unreadCount = notifications.filter((n) => !n.read).length

  // Render-time adjustment (not the effect below) for a demoMode change
  // after mount - e.g. switching Client -> Demo mid-session must swap the
  // real feed out for the static demo one immediately, not leave stale
  // real notifications on screen until the next real fetch would have run.
  const [prevDemoMode, setPrevDemoMode] = React.useState(demoMode)
  if (demoMode !== prevDemoMode) {
    setPrevDemoMode(demoMode)
    if (demoMode) {
      setNotifications(NOTIFICATIONS)
      setLoaded(true)
    } else {
      setNotifications([])
      setLoaded(false)
    }
  }

  React.useEffect(() => {
    if (demoMode) return
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/notifications", { credentials: "same-origin" })
        if (!res.ok || cancelled) return
        const data = await res.json()
        if (!cancelled) setNotifications(data.notifications)
      } catch {
        // Bell just stays empty - never blocks or breaks the rest of the page.
      } finally {
        if (!cancelled) setLoaded(true)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [demoMode])

  async function markAllRead() {
    const unread = notifications.filter((n) => !n.read)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    // Demo notifications are never sent to the real API - a demo-mode click
    // must not mark a real notification read.
    if (demoMode) return
    await Promise.all(
      unread.map((n) => fetch(`/api/notifications/${n.id}`, { method: "PATCH", credentials: "same-origin" }).catch(() => null))
    )
  }

  async function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    if (demoMode) return
    await fetch(`/api/notifications/${id}`, { method: "PATCH", credentials: "same-origin" }).catch(() => null)
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="relative flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
          />
        }
      >
        <Bell className="size-4.5" strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex size-2 rounded-full bg-brand ring-2 ring-background" />
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <span className="text-sm font-medium text-foreground">Notifications</span>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs font-medium text-brand hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="flex max-h-96 flex-col overflow-y-auto">
          {!loaded ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Bell className="size-5 animate-pulse text-muted-foreground/50" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Bell className="size-5 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">You&apos;re all caught up.</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = TYPE_ICON[notification.type]
              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => markRead(notification.id)}
                  className={cn(
                    "flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-muted/60",
                    !notification.read && "bg-brand/[0.04]"
                  )}
                >
                  <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full", TYPE_TONE[notification.type])}>
                    <Icon className="size-3.5" strokeWidth={1.75} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex items-start justify-between gap-2">
                      <span className="text-[13px] font-medium text-foreground">{notification.title}</span>
                      {!notification.read && (
                        <span className="mt-1 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                      )}
                    </span>
                    <span className="line-clamp-2 text-xs text-muted-foreground">{notification.description}</span>
                    <span className="text-[11px] text-muted-foreground/70">
                      {formatRelativeTime(notification.createdAt, new Date())}
                    </span>
                  </span>
                </button>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
