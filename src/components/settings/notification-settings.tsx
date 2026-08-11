"use client"

import * as React from "react"
import { MessageCircle, MessageSquare, CircleX, TriangleAlert, Workflow } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
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

export function NotificationSettings() {
  const [state, setState] = React.useState<Record<string, boolean>>(
    Object.fromEntries(ROWS.map((r) => [r.key, r.defaultChecked]))
  )

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
          <Switch
            checked={state[row.key]}
            onCheckedChange={(checked) => setState((prev) => ({ ...prev, [row.key]: checked }))}
          />
        </div>
      ))}
    </Card>
  )
}
