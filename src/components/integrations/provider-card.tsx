"use client"

import { Card } from "@/components/ui/card"
import { StatusBadge, type StatusTone } from "@/components/dashboard/status-badge"
import type { ProviderConnectionView } from "./types"

const STATUS_LABEL: Record<ProviderConnectionView["status"], string> = {
  not_configured: "Needs setup",
  configured: "Configured",
  connecting: "Connecting…",
  connected: "Connected",
  error: "Error",
  expired: "Expired",
  disabled: "Disabled",
}

const STATUS_TONE: Record<ProviderConnectionView["status"], StatusTone> = {
  not_configured: "neutral",
  configured: "info",
  connecting: "info",
  connected: "success",
  error: "error",
  expired: "warning",
  disabled: "neutral",
}

const MODE_LABEL: Record<ProviderConnectionView["mode"], string> = {
  disabled: "Disabled",
  demo: "Demo",
  live: "Live",
}

function formatRelative(iso: string | null): string {
  if (!iso) return "Never"
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.round(diffMs / 60000)
  if (diffMin < 1) return "Just now"
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.round(diffHr / 24)
  return `${diffDay}d ago`
}

export function ProviderCard({ provider, onOpen }: { provider: ProviderConnectionView; onOpen: () => void }) {
  return (
    <Card interactive className="gap-3 px-4 py-4" onClick={onOpen}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">{provider.name}</span>
          <span className="text-xs text-muted-foreground">{MODE_LABEL[provider.mode]} mode</span>
        </div>
        <StatusBadge tone={STATUS_TONE[provider.status]}>{STATUS_LABEL[provider.status]}</StatusBadge>
      </div>

      <p className="line-clamp-2 text-xs text-muted-foreground">{provider.description}</p>

      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>Last tested: {formatRelative(provider.lastTestedAt)}</span>
        {provider.usingEnvFallback && <span className="text-brand">Server default</span>}
      </div>
    </Card>
  )
}
