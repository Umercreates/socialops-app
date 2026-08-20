"use client"

import * as React from "react"
import { AutomationCard } from "@/components/automations/automation-card"
import { AutomationBuilderDialog } from "@/components/automations/automation-builder-dialog"
import { TestAutomationDialog } from "@/components/automations/test-automation-dialog"
import { useAuth } from "@/lib/auth/auth-context"
import { useAutomations } from "@/lib/store/automations-store"
import type { Automation } from "@/types"

/** Demo Mode Automations - same cards/dialogs as the real page, backed by
 * the demo store. AutomationBuilderDialog is mode-aware internally and
 * never reaches /api/automations while in demo mode. */
export function DemoAutomationsPageContent() {
  const { user } = useAuth()
  const canManage = user?.role === "owner" || user?.role === "admin" || user?.role === "manager"
  const { automations, addAutomation, setStatus, removeAutomation, duplicateAutomation } = useAutomations()
  const [testing, setTesting] = React.useState<Automation | null>(null)

  const activeCount = automations.filter((a) => a.status === "active").length

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 ease-out">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Automations</h2>
          <p className="text-sm text-muted-foreground">{activeCount} active · {automations.length} total · Demo workspace</p>
        </div>
        {canManage && <AutomationBuilderDialog onCreated={addAutomation} />}
      </div>

      {automations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-16 text-center text-sm text-muted-foreground">
          No automations yet. {canManage ? "Create one to get started." : "Ask an owner, admin, or manager to create one."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {automations.map((automation) => (
            <AutomationCard
              key={automation.id}
              automation={automation}
              onToggle={(checked) => setStatus(automation.id, checked ? "active" : "paused")}
              onDuplicate={() => duplicateAutomation(automation.id)}
              onDelete={() => removeAutomation(automation.id)}
              onTest={() => setTesting(automation)}
            />
          ))}
        </div>
      )}

      <TestAutomationDialog automation={testing} onOpenChange={(open) => !open && setTesting(null)} onComplete={() => {}} />
    </div>
  )
}
