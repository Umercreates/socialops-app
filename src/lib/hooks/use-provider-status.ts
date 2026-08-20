"use client"

import * as React from "react"
import { useDemoMode } from "@/lib/demo-mode-context"
import type { ProviderConnectionView, ProviderId } from "@/components/integrations/types"

/**
 * The single, real source of truth a client component should ever use to
 * decide whether a provider is genuinely live for the current workspace -
 * fetches the same /api/integrations/[provider] view the Integrations
 * Center itself renders from. Nothing derives "live" from the DEMO_MODE
 * flag for the *value* of isLive/view; DEMO_MODE only controls whether a
 * module's own simulated fallback experience is offered when the real
 * thing isn't configured.
 *
 * Demo Mode itself never calls this real endpoint at all - Demo Mode must
 * be 100% self-contained (zero real provider/workspace API dependency),
 * so every one of this hook's consumers (WhatsApp/Call Agent/Sheets
 * settings, book-meeting-dialog, connection-card) gets that guarantee for
 * free without touching any of them individually.
 */
export interface ProviderStatus {
  loading: boolean
  view: ProviderConnectionView | null
  /** True only once a real Test Connection has passed AND the workspace
   * has explicitly activated the provider - never true just because
   * credentials exist, and never derived from any global env flag. */
  isLive: boolean
}

export function useProviderStatus(provider: ProviderId): ProviderStatus {
  const demoMode = useDemoMode()
  const [view, setView] = React.useState<ProviderConnectionView | null>(null)
  const [loading, setLoading] = React.useState(() => !demoMode)

  // Render-time adjustment (not the effect below) for a demoMode change
  // after mount - switching modes mid-session must not leave the other
  // mode's stale view/loading state on screen.
  const [prevDemoMode, setPrevDemoMode] = React.useState(demoMode)
  if (demoMode !== prevDemoMode) {
    setPrevDemoMode(demoMode)
    if (demoMode) {
      setView(null)
      setLoading(false)
    } else {
      setLoading(true)
    }
  }

  React.useEffect(() => {
    if (demoMode) return
    let cancelled = false

    async function load() {
      setLoading(true)
      const data = await fetch(`/api/integrations/${provider}`, { credentials: "same-origin" })
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null)
      if (cancelled) return
      setView(data?.provider ?? null)
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [provider, demoMode])

  const isLive = view?.mode === "live" && view.readiness.readyForLive
  return { loading, view, isLive }
}
