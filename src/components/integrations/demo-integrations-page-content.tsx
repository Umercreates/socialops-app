"use client"

import * as React from "react"
import { Sparkles, X as XIcon } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ProviderCard } from "@/components/integrations/provider-card"
import { CATEGORY_LABELS, PROVIDER_REGISTRY, type ProviderCategory, type ProviderId } from "@/lib/integrations/providers"
import type { ProviderConnectionView } from "@/components/integrations/types"

const CATEGORY_ORDER: ProviderCategory[] = ["ai", "messaging", "social", "calling", "productivity"]

const now = new Date().toISOString()

/** Fabricated purely for display - every provider looks configured and
 * live, since the point of Demo Mode is showing what a fully set-up
 * workspace looks like. Never persisted, never derived from (or written
 * to) any real integration_connections row. */
function demoProviderView(id: ProviderId): ProviderConnectionView {
  const def = PROVIDER_REGISTRY[id]
  return {
    provider: id,
    name: def.name,
    category: def.category,
    description: def.description,
    mode: "live",
    status: "connected",
    displayName: `Demo ${def.name}`,
    config: {},
    credentialFields: def.credentialFields.map((f) => ({
      key: f.key,
      label: f.label,
      secret: f.secret,
      required: f.required,
      configured: true,
      maskedValue: f.secret ? "••••demo" : "demo",
      source: "workspace" as const,
    })),
    usingEnvFallback: false,
    lastTestedAt: now,
    lastSuccessAt: now,
    lastErrorMessage: null,
    updatedAt: now,
    readiness: { configured: true, credentialsComplete: true, oauthComplete: true, webhookComplete: true, testPassed: true, readyForLive: true, missing: [] },
  }
}

const DEMO_PROVIDERS: ProviderConnectionView[] = (Object.keys(PROVIDER_REGISTRY) as ProviderId[]).map(demoProviderView)

/** Demo Mode Integrations - shows a realistic, fully-configured environment
 * without touching a single real credential, OAuth flow, or Test
 * Connection call (all of which are additionally rejected server-side in
 * demo mode regardless - see requireClientMode). Clicking a provider opens
 * a read-only demo detail view, never the real editable connection sheet. */
export function DemoIntegrationsPageContent() {
  const [selected, setSelected] = React.useState<ProviderConnectionView | null>(null)

  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    items: DEMO_PROVIDERS.filter((p) => p.category === category),
  })).filter((g) => g.items.length > 0)

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">APIs & Integrations</h2>
        <p className="text-sm text-muted-foreground">
          Demo workspace - every provider below is a fabricated example, not a real connection.
        </p>
      </div>

      {grouped.map((group) => (
        <div key={group.category} className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-muted-foreground">{CATEGORY_LABELS[group.category as ProviderCategory]}</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((provider) => (
              <ProviderCard key={provider.provider} provider={provider} onOpen={() => setSelected(provider)} />
            ))}
          </div>
        </div>
      ))}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selected.name}
                  <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-medium text-warning-foreground dark:text-warning">
                    <Sparkles className="size-3" strokeWidth={2} />
                    Demo connection
                  </span>
                </DialogTitle>
                <DialogDescription>{selected.description}</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-2 text-sm">
                <p className="text-muted-foreground">
                  This is example data showing what a configured, active connection looks like. Switch to Client Mode to connect,
                  test, or manage a real {selected.name} connection for your workspace.
                </p>
                <ul className="flex flex-col gap-1">
                  {selected.credentialFields.map((field) => (
                    <li key={field.key} className="flex items-center justify-between rounded-md bg-muted/50 px-2.5 py-1.5 text-xs">
                      <span className="text-muted-foreground">{field.label}</span>
                      <span className="font-mono text-foreground">{field.maskedValue}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="mt-1 flex items-center justify-center gap-1.5 self-end text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <XIcon className="size-3.5" />
                Close
              </button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
