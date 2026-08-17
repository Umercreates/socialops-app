"use client"

import * as React from "react"
import type { ProviderConnectionView, ProviderId } from "@/components/integrations/types"

/**
 * The single, real source of truth a client component should ever use to
 * decide whether a provider is genuinely live for the current workspace -
 * fetches the same /api/integrations/[provider] view the Integrations
 * Center itself renders from. Nothing derives "live" from the DEMO_MODE
 * flag anymore; DEMO_MODE only controls whether a module's own simulated
 * fallback experience is offered when the real thing isn't configured.
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
  const [view, setView] = React.useState<ProviderConnectionView | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
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
  }, [provider])

  const isLive = view?.mode === "live" && view.readiness.readyForLive
  return { loading, view, isLive }
}
