"use client"

import * as React from "react"
import { MessageCircle, MessageSquare, CircleX, TriangleAlert, Workflow } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useDashboardViewMode } from "@/lib/dashboard-view-mode-context"
import type { LucideIcon } from "lucide-react"

interface NotificationRow {
  key: string
  icon: LucideIcon
  label: string
  description: string
  defaultChecked: boolean
}

const ROWS: NotificationRow[] = [
  { key: "dms", icon: MessageCircle, label: "New DMs", description: "Get notified when someone messages a connected account", defaultChecked: true },
  { key: "comments", icon: MessageSquare, label: "New comments", description: "Get notified on new post comments", defaultChecked: true },
  { key: "failed", icon: CircleX, label: "Failed posts", description: "Get notified when a scheduled post fails to publish", defaultChecked: true },
  { key: "account-issues", icon: TriangleAlert, label: "Account issues", description: "Get notified when a connection expires or needs attention", defaultChecked: true },
  { key: "automations", icon: Workflow, label: "Automation activity", description: "Get notified about automation runs and escalations", defaultChecked: false },
]

const DEFAULTS: Record<string, boolean> = Object.fromEntries(ROWS.map((r) => [r.key, r.defaultChecked]))

/** In Client Mode, real workspace-scoped preferences - persisted in
 * workspace_settings.notification_preferences via /api/workspace-settings.
 * In Demo Mode, toggles flip local-only state and are never sent to the
 * real workspace row, so a demo click can't change the client's own
 * notification preferences. */
export function NotificationSettings() {
  const { mode } = useDashboardViewMode()
  const [state, setState] = React.useState<Record<string, boolean>>(DEFAULTS)
  const [loading, setLoading] = React.useState(() => mode !== "demo")

  // Render-time adjustment (not an effect) for a mode switch after mount -
  // demo always resets to the un-persisted defaults.
  const [prevMode, setPrevMode] = React.useState(mode)
  if (mode !== prevMode) {
    setPrevMode(mode)
    if (mode === "demo") {
      setState(DEFAULTS)
      setLoading(false)
    } else {
      setLoading(true)
    }
  }

  React.useEffect(() => {
    if (mode !== "client") return

    let cancelled = false

    async function load() {
      setLoading(true)
      const data = await fetch("/api/workspace-settings", { credentials: "same-origin" })
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null)
      if (cancelled) return
      const saved = data?.settings?.notificationPreferences as Record<string, boolean> | undefined
      if (saved && Object.keys(saved).length > 0) setState({ ...DEFAULTS, ...saved })
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [mode])

  async function handleToggle(key: string, checked: boolean) {
    const next = { ...state, [key]: checked }
    setState(next)

    if (mode === "demo") return

    await fetch("/api/workspace-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ notificationPreferences: next }),
    }).catch(() => {
      // Best-effort: a failed save just leaves the toggle out of sync with
      // the server until the next successful one - not worth a whole
      // error-banner UI for a preferences toggle.
    })
  }

  return (
    <Card className="gap-1 px-4 py-2 sm:px-5">
      {ROWS.map((row) => (
        <div key={row.key} className="flex items-center gap-3 border-b border-border py-3.5 last:border-b-0">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
            <row.icon className="size-4 text-muted-foreground" strokeWidth={1.75} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-sm text-foreground">{row.label}</span>
            <span className="text-xs text-muted-foreground">{row.description}</span>
          </div>
          <Switch checked={state[row.key]} disabled={loading} onCheckedChange={(checked) => handleToggle(row.key, checked)} />
        </div>
      ))}
    </Card>
  )
}
