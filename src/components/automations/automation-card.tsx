"use client"

import { ArrowRight, Copy, FlaskConical, Trash2, UserCheck2, Clock3 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { PlatformIcon, PLATFORM_LABEL } from "@/components/dashboard/platform-icon"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { formatRelativeTime } from "@/lib/format"
import type { Automation } from "@/types"

interface AutomationCardProps {
  automation: Automation
  onToggle: (checked: boolean) => void
  onDuplicate: () => void
  onDelete: () => void
  onTest: () => void
}

export function AutomationCard({ automation, onToggle, onDuplicate, onDelete, onTest }: AutomationCardProps) {
  return (
    <Card className="gap-3.5 px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">{automation.name}</span>
          <div className="flex items-center gap-2">
            <StatusBadge tone={automation.status === "active" ? "success" : automation.status === "paused" ? "warning" : "neutral"}>
              {automation.status === "active" ? "Active" : automation.status === "paused" ? "Paused" : "Draft"}
            </StatusBadge>
            {automation.platform !== "all" && <PlatformIcon platform={automation.platform} accent size={13} />}
            <span className="text-xs text-muted-foreground">
              {automation.platform === "all" ? "All platforms" : PLATFORM_LABEL[automation.platform]}
            </span>
          </div>
        </div>
        <Switch checked={automation.status === "active"} onCheckedChange={onToggle} />
      </div>

      <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-muted/60 px-3 py-2.5 text-xs text-foreground">
        <span className="font-medium text-muted-foreground">WHEN</span>
        <span>{automation.trigger.label}</span>
        <ArrowRight className="size-3 text-muted-foreground" />
        <span className="font-medium text-muted-foreground">IF</span>
        <span>{automation.condition.label}</span>
        <ArrowRight className="size-3 text-muted-foreground" />
        <span className="font-medium text-muted-foreground">THEN</span>
        <span>{automation.action.label}</span>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <UserCheck2 className="size-3" />
          {automation.rules.runMode === "manual-approval" ? "Manual approval" : "Automatic"}
        </span>
        {automation.rules.workingHoursOnly && (
          <span className="flex items-center gap-1">
            <Clock3 className="size-3" />
            Working hours only
          </span>
        )}
        <span>Max {automation.rules.maxAttempts} attempt{automation.rules.maxAttempts === 1 ? "" : "s"}</span>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{automation.runsLast30d} runs · 30d</span>
        <span>{automation.lastRunAt ? `Last run ${formatRelativeTime(automation.lastRunAt, new Date())}` : "Never run"}</span>
      </div>

      <div className="flex items-center gap-1.5 border-t border-border pt-3">
        <Button variant="outline" size="sm" onClick={onTest}>
          <FlaskConical />
          Test
        </Button>
        <Button variant="ghost" size="sm" onClick={onDuplicate}>
          <Copy />
          Duplicate
        </Button>
        <Button variant="ghost" size="sm" className="ml-auto text-destructive hover:text-destructive" onClick={onDelete}>
          <Trash2 />
          Delete
        </Button>
      </div>
    </Card>
  )
}
