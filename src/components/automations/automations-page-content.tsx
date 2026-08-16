"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { AutomationCard } from "@/components/automations/automation-card"
import { AutomationBuilderDialog } from "@/components/automations/automation-builder-dialog"
import { TestAutomationDialog } from "@/components/automations/test-automation-dialog"
import { useAuth } from "@/lib/auth/auth-context"
import type { Automation, AutomationStatus } from "@/types"

export function AutomationsPageContent() {
  const { user } = useAuth()
  const canManage = user?.role === "owner" || user?.role === "admin" || user?.role === "manager"

  const [automations, setAutomations] = React.useState<Automation[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [testing, setTesting] = React.useState<Automation | null>(null)

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/automations", { credentials: "same-origin" })
        if (!res.ok) throw new Error("Failed to load automations")
        const data = await res.json()
        if (!cancelled) setAutomations(data.automations)
      } catch {
        if (!cancelled) setError("Couldn't load automations. Try refreshing.")
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function setStatus(id: string, status: AutomationStatus) {
    const previous = automations
    setAutomations((prev) => prev?.map((a) => (a.id === id ? { ...a, status } : a)) ?? null)
    try {
      const res = await fetch(`/api/automations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error("Update failed")
    } catch {
      setAutomations(previous ?? null)
      setError("Couldn't update that automation. Try again.")
    }
  }

  async function removeAutomation(id: string) {
    const previous = automations
    setAutomations((prev) => prev?.filter((a) => a.id !== id) ?? null)
    try {
      const res = await fetch(`/api/automations/${id}`, { method: "DELETE", credentials: "same-origin" })
      if (!res.ok) throw new Error("Delete failed")
    } catch {
      setAutomations(previous ?? null)
      setError("Couldn't delete that automation. Try again.")
    }
  }

  async function duplicateAutomation(id: string) {
    const original = automations?.find((a) => a.id === id)
    if (!original) return
    try {
      const res = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          name: `${original.name} (copy)`,
          platform: original.platform,
          trigger: original.trigger,
          condition: original.condition,
          action: original.action,
          rules: original.rules,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Duplicate failed")
      setAutomations((prev) => (prev ? [data.automation, ...prev] : [data.automation]))
    } catch {
      setError("Couldn't duplicate that automation. Try again.")
    }
  }

  const activeCount = automations?.filter((a) => a.status === "active").length ?? 0

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 ease-out">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Automations</h2>
          <p className="text-sm text-muted-foreground">
            {automations ? `${activeCount} active · ${automations.length} total` : ""}
          </p>
        </div>
        {canManage && (
          <AutomationBuilderDialog onCreated={(automation) => setAutomations((prev) => (prev ? [automation, ...prev] : [automation]))} />
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!automations ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading automations...
        </div>
      ) : automations.length === 0 ? (
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

      {/* Sandboxed preview only - never touches the real automation's run
          stats, since it doesn't execute anything real (see the dialog's
          own "Simulated against sample data" label). */}
      <TestAutomationDialog automation={testing} onOpenChange={(open) => !open && setTesting(null)} onComplete={() => {}} />
    </div>
  )
}
