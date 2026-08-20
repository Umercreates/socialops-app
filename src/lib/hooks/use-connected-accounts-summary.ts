"use client"

import * as React from "react"
import { useDashboardViewMode } from "@/lib/dashboard-view-mode-context"
import { SOCIAL_ACCOUNTS } from "@/lib/data/accounts"

/** Small header-badge summary ("N/M connected") that must work regardless
 * of mode. Reads the static demo seed directly (not the mutable
 * AccountsProvider context) rather than conditionally calling a different
 * hook per mode, which would violate the rules of hooks now that
 * AccountsProvider is only mounted in demo mode - a header badge doesn't
 * need session-mutation reactivity the way the real Accounts page does. */
export function useConnectedAccountsSummary(): { connected: number; total: number } {
  const { mode } = useDashboardViewMode()
  const [realSummary, setRealSummary] = React.useState({ connected: 0, total: 0 })

  React.useEffect(() => {
    if (mode !== "client") return
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/social-accounts", { credentials: "same-origin" })
        if (!res.ok || cancelled) return
        const data = await res.json()
        const accounts = data.accounts as { health: string }[]
        if (!cancelled) setRealSummary({ connected: accounts.filter((a) => a.health !== "disconnected").length, total: accounts.length })
      } catch {
        // Badge just stays at 0/0 - never blocks or breaks the header.
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [mode])

  if (mode === "demo") {
    return {
      connected: SOCIAL_ACCOUNTS.filter((a) => a.health !== "disconnected").length,
      total: SOCIAL_ACCOUNTS.length,
    }
  }
  return realSummary
}
