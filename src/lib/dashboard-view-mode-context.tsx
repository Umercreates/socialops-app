"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import type { DashboardViewMode } from "@/lib/dashboard-view-mode"

interface DashboardViewModeContextValue {
  mode: DashboardViewMode
  /** True immediately after a switch is requested until the server
   * components relying on it have re-rendered. Lets the switcher show a
   * brief pending state instead of feeling laggy or double-clickable. */
  switching: boolean
  setMode: (mode: DashboardViewMode) => void
}

const DashboardViewModeContext = React.createContext<DashboardViewModeContextValue | null>(null)

/** Populated once, server-side, from the same cookie getDashboardViewMode()
 * reads (see dashboard/layout.tsx) - this is the client-side mirror of
 * that value, plus the ability to change it. Changing the mode posts to
 * /api/dashboard-mode (which sets the cookie) then calls router.refresh()
 * so every server component re-renders against the new mode - the route
 * itself never changes, only what each page fetches. */
export function DashboardViewModeProvider({ initialMode, children }: { initialMode: DashboardViewMode; children: React.ReactNode }) {
  const router = useRouter()
  const [mode, setModeState] = React.useState<DashboardViewMode>(initialMode)
  const [switching, setSwitching] = React.useState(false)

  // Keeps the client value in sync if the server-resolved mode changes out
  // from under it (e.g. a hard navigation, or the cookie being absent on a
  // fresh session) - without this, a stale client value could disagree
  // with what the server just rendered. Adjusted during render (React's
  // documented pattern for "state derived from a prop") rather than an
  // effect, which would cause an extra render pass on every mode change.
  const [prevInitialMode, setPrevInitialMode] = React.useState(initialMode)
  if (initialMode !== prevInitialMode) {
    setPrevInitialMode(initialMode)
    setModeState(initialMode)
    setSwitching(false)
  }

  const setMode = React.useCallback(
    (next: DashboardViewMode) => {
      if (next === mode) return
      setSwitching(true)
      setModeState(next)
      fetch("/api/dashboard-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ mode: next }),
      })
        .catch(() => null)
        .finally(() => {
          router.refresh()
        })
    },
    [mode, router]
  )

  const value = React.useMemo<DashboardViewModeContextValue>(() => ({ mode, switching, setMode }), [mode, switching, setMode])

  return <DashboardViewModeContext.Provider value={value}>{children}</DashboardViewModeContext.Provider>
}

export function useDashboardViewMode(): DashboardViewModeContextValue {
  const ctx = React.useContext(DashboardViewModeContext)
  if (!ctx) throw new Error("useDashboardViewMode must be used within a DashboardViewModeProvider")
  return ctx
}
