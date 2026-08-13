"use client"

import * as React from "react"
import { Loader2, ShieldOff } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { ProviderCard } from "./provider-card"
import { ProviderDetailSheet } from "./provider-detail-sheet"
import type { ProviderConnectionView } from "./types"
import { CATEGORY_LABELS, type ProviderCategory } from "@/lib/integrations/providers"

const CATEGORY_ORDER: ProviderCategory[] = ["ai", "messaging", "social", "calling", "google"]

export function IntegrationsPageContent() {
  const { user } = useAuth()
  const [providers, setProviders] = React.useState<ProviderConnectionView[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [forbidden, setForbidden] = React.useState(false)
  const [selected, setSelected] = React.useState<ProviderConnectionView | null>(null)
  const [sheetOpen, setSheetOpen] = React.useState(false)

  const canManage = user?.role === "owner" || user?.role === "admin"

  React.useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch("/api/integrations", { credentials: "same-origin" })
        if (cancelled) return
        if (res.status === 403) {
          setForbidden(true)
          return
        }
        if (!res.ok) throw new Error("Failed to load")
        const data = await res.json()
        if (!cancelled) setProviders(data.providers)
      } catch {
        if (!cancelled) setError("Couldn't load integrations. Check your connection and try again.")
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  function handleUpdated(updated: ProviderConnectionView) {
    setProviders((prev) => (prev ? prev.map((p) => (p.provider === updated.provider ? updated : p)) : prev))
    setSelected(updated)
  }

  if (forbidden) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <ShieldOff className="size-8 text-muted-foreground" strokeWidth={1.5} />
        <h2 className="text-base font-semibold text-foreground">Access restricted</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          APIs & Integrations is only available to workspace owners, admins, and managers.
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    )
  }

  if (!providers) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    items: providers.filter((p) => p.category === category),
  })).filter((g) => g.items.length > 0)

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">APIs & Integrations</h2>
        <p className="text-sm text-muted-foreground">
          Connect and manage the providers that power EasyLife — AI, WhatsApp, social platforms, calling, and Google.
        </p>
      </div>

      {grouped.map((group) => (
        <div key={group.category} className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-muted-foreground">{CATEGORY_LABELS[group.category]}</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((provider) => (
              <ProviderCard
                key={provider.provider}
                provider={provider}
                onOpen={() => {
                  setSelected(provider)
                  setSheetOpen(true)
                }}
              />
            ))}
          </div>
        </div>
      ))}

      <ProviderDetailSheet
        provider={selected}
        canManage={canManage}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSaved={handleUpdated}
      />
    </div>
  )
}
