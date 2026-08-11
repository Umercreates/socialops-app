"use client"

import * as React from "react"
import { Sparkles } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlatformIcon, PLATFORM_LABEL } from "@/components/dashboard/platform-icon"
import { TRIGGER_OPTIONS, CONDITION_OPTIONS, ACTION_OPTIONS, labelFor } from "@/lib/automation-options"
import { generateAutomationId, useAutomations } from "@/lib/store/automations-store"
import type {
  Automation,
  AutomationActionType,
  AutomationConditionType,
  AutomationRunMode,
  AutomationTriggerType,
  SocialPlatform,
} from "@/types"

const PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "youtube", "x"]

export function AutomationBuilderDialog() {
  const { addAutomation } = useAutomations()
  const [open, setOpen] = React.useState(false)

  const [name, setName] = React.useState("")
  const [platform, setPlatform] = React.useState<SocialPlatform | "all">("all")
  const [triggerType, setTriggerType] = React.useState<AutomationTriggerType>("new-comment")
  const [triggerValue, setTriggerValue] = React.useState("")
  const [conditionType, setConditionType] = React.useState<AutomationConditionType>("none")
  const [conditionValue, setConditionValue] = React.useState("")
  const [actionType, setActionType] = React.useState<AutomationActionType>("reply")
  const [actionValue, setActionValue] = React.useState("")
  const [runMode, setRunMode] = React.useState<AutomationRunMode>("manual-approval")
  const [workingHoursOnly, setWorkingHoursOnly] = React.useState(true)
  const [delayMinutes, setDelayMinutes] = React.useState(0)
  const [maxAttempts, setMaxAttempts] = React.useState(1)
  const [escalateAfterFailures, setEscalateAfterFailures] = React.useState(false)

  function reset() {
    setName("")
    setPlatform("all")
    setTriggerType("new-comment")
    setTriggerValue("")
    setConditionType("none")
    setConditionValue("")
    setActionType("reply")
    setActionValue("")
    setRunMode("manual-approval")
    setWorkingHoursOnly(true)
    setDelayMinutes(0)
    setMaxAttempts(1)
    setEscalateAfterFailures(false)
  }

  function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim()) return

    const automation: Automation = {
      id: generateAutomationId(),
      name: name.trim(),
      status: "draft",
      platform,
      trigger: {
        type: triggerType,
        label: labelFor(TRIGGER_OPTIONS, triggerType) + (triggerValue ? `: "${triggerValue}"` : ""),
        value: triggerValue || undefined,
      },
      condition: {
        type: conditionType,
        label: labelFor(CONDITION_OPTIONS, conditionType) + (conditionValue ? `: "${conditionValue}"` : ""),
        value: conditionValue || undefined,
      },
      action: {
        type: actionType,
        label: labelFor(ACTION_OPTIONS, actionType) + (actionValue ? `: "${actionValue}"` : ""),
        value: actionValue || undefined,
      },
      rules: {
        runMode,
        workingHoursOnly,
        delayMinutes,
        maxAttempts,
        escalateAfterFailures,
      },
      runsLast30d: 0,
      lastRunAt: null,
    }
    addAutomation(automation)
    reset()
    setOpen(false)
  }

  const triggerNeedsValue = TRIGGER_OPTIONS.find((o) => o.value === triggerType)?.needsValue
  const conditionNeedsValue = CONDITION_OPTIONS.find((o) => o.value === conditionType)?.needsValue
  const actionNeedsValue = ACTION_OPTIONS.find((o) => o.value === actionType)?.needsValue

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger render={<Button />} nativeButton={false}>
        <Sparkles />
        Create automation
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleCreate} className="flex max-h-[80vh] flex-col gap-4 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create automation</DialogTitle>
            <DialogDescription>Build a simple when → if → then rule. Runs against demo data only.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auto-name">Name</Label>
            <Input
              id="auto-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Pricing question auto-reply"
              className="h-9"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Platform scope</Label>
            <Select value={platform} onValueChange={(v) => setPlatform(v as SocialPlatform | "all")}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All platforms</SelectItem>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p} value={p}>
                    <PlatformIcon platform={p} accent size={14} />
                    {PLATFORM_LABEL[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
            <StepRow label="WHEN">
              <Select value={triggerType} onValueChange={(v) => setTriggerType(v as AutomationTriggerType)}>
                <SelectTrigger className="h-8 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </StepRow>
            {triggerNeedsValue && (
              <Input
                value={triggerValue}
                onChange={(event) => setTriggerValue(event.target.value)}
                placeholder="Keyword…"
                className="h-8"
              />
            )}

            <StepRow label="IF">
              <Select value={conditionType} onValueChange={(v) => setConditionType(v as AutomationConditionType)}>
                <SelectTrigger className="h-8 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITION_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </StepRow>
            {conditionNeedsValue && (
              <Input
                value={conditionValue}
                onChange={(event) => setConditionValue(event.target.value)}
                placeholder="Value…"
                className="h-8"
              />
            )}

            <StepRow label="THEN">
              <Select value={actionType} onValueChange={(v) => setActionType(v as AutomationActionType)}>
                <SelectTrigger className="h-8 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </StepRow>
            {actionNeedsValue && (
              <Input
                value={actionValue}
                onChange={(event) => setActionValue(event.target.value)}
                placeholder="Value…"
                className="h-8"
              />
            )}
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
            <span className="text-xs font-semibold text-muted-foreground">Rules</span>

            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="auto-run-mode" className="text-sm font-normal">
                Run mode
              </Label>
              <Select value={runMode} onValueChange={(v) => setRunMode(v as AutomationRunMode)}>
                <SelectTrigger id="auto-run-mode" size="sm" className="h-8 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual-approval">Manual approval</SelectItem>
                  <SelectItem value="automatic">Automatic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="auto-working-hours" className="text-sm font-normal">
                Working hours only
              </Label>
              <Switch id="auto-working-hours" checked={workingHoursOnly} onCheckedChange={setWorkingHoursOnly} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="auto-delay" className="text-xs text-muted-foreground">
                  Delay (minutes)
                </Label>
                <Input
                  id="auto-delay"
                  type="number"
                  min={0}
                  value={delayMinutes}
                  onChange={(event) => setDelayMinutes(Number(event.target.value) || 0)}
                  className="h-8"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="auto-max-attempts" className="text-xs text-muted-foreground">
                  Max attempts
                </Label>
                <Input
                  id="auto-max-attempts"
                  type="number"
                  min={1}
                  value={maxAttempts}
                  onChange={(event) => setMaxAttempts(Math.max(1, Number(event.target.value) || 1))}
                  className="h-8"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="auto-escalate" className="text-sm font-normal">
                Escalate to human after failures
              </Label>
              <Switch id="auto-escalate" checked={escalateAfterFailures} onCheckedChange={setEscalateAfterFailures} />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={!name.trim()}>
              Save automation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function StepRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-10 shrink-0 text-xs font-semibold text-muted-foreground">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  )
}
