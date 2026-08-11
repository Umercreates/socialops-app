"use client"

import * as React from "react"
import { AutomationCard } from "@/components/automations/automation-card"
import { AutomationBuilderDialog } from "@/components/automations/automation-builder-dialog"
import { TestAutomationDialog } from "@/components/automations/test-automation-dialog"
import { useAutomations } from "@/lib/store/automations-store"
import type { Automation } from "@/types"

export function AutomationsPageContent() {
  const { automations, setStatus, removeAutomation, duplicateAutomation, recordTestRun } = useAutomations()
  const [testing, setTesting] = React.useState<Automation | null>(null)

  const activeCount = automations.filter((a) => a.status === "active").length

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Automations</h2>
          <p className="text-sm text-muted-foreground">
            {activeCount} active · {automations.length} total
          </p>
        </div>
        <AutomationBuilderDialog />
      </div>

      {automations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-16 text-center text-sm text-muted-foreground">
          No automations yet. Create one to get started.
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

      <TestAutomationDialog
        automation={testing}
        onOpenChange={(open) => !open && setTesting(null)}
        onComplete={() => testing && recordTestRun(testing.id)}
      />
    </div>
  )
}
