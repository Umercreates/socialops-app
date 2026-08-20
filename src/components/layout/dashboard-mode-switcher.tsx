"use client"

import { Sparkles, Building2 } from "lucide-react"
import { useDashboardViewMode } from "@/lib/dashboard-view-mode-context"
import { cn } from "@/lib/utils"

/** The single control that switches the entire dashboard between the demo
 * workspace and the authenticated client's real one - see
 * DashboardViewModeProvider for how the switch actually propagates. */
export function DashboardModeSwitcher() {
  const { mode, switching, setMode } = useDashboardViewMode()

  return (
    <div
      className="flex h-8 shrink-0 items-center gap-0.5 rounded-lg bg-muted p-0.5"
      role="radiogroup"
      aria-label="Dashboard mode"
    >
      <button
        type="button"
        role="radio"
        aria-checked={mode === "demo"}
        disabled={switching}
        onClick={() => setMode("demo")}
        className={cn(
          "flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors disabled:pointer-events-none disabled:opacity-70",
          mode === "demo" ? "bg-card text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Sparkles className="size-3.5" strokeWidth={1.75} />
        <span className="hidden sm:inline">Demo Mode</span>
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={mode === "client"}
        disabled={switching}
        onClick={() => setMode("client")}
        className={cn(
          "flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors disabled:pointer-events-none disabled:opacity-70",
          mode === "client" ? "bg-card text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Building2 className="size-3.5" strokeWidth={1.75} />
        <span className="hidden sm:inline">Client Mode</span>
      </button>
    </div>
  )
}

/** Small, persistent header badge shown only in demo mode - reminds
 * whoever is demoing the product that nothing here is real, without
 * covering the UI in a warning banner. */
export function DemoModeBadge() {
  return (
    <span className="hidden items-center gap-1.5 rounded-full bg-warning/15 px-2.5 py-1 text-[11px] font-medium text-warning-foreground md:inline-flex dark:text-warning">
      <Sparkles className="size-3" strokeWidth={2} />
      Demo Workspace — no real actions are sent
    </span>
  )
}
