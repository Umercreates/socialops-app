"use client"

import { Plug } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { RealSettingsPointer } from "@/components/settings/real-settings-pointer"
import { useDemoMode } from "@/lib/demo-mode-context"
import { useIntegrations } from "@/lib/store/settings-store"
import type { IntegrationStatus } from "@/types"

const STATUS_TONE: Record<IntegrationStatus, "success" | "neutral" | "warning"> = {
  connected: "success",
  "not-connected": "neutral",
  "coming-soon": "warning",
}

const STATUS_LABEL: Record<IntegrationStatus, string> = {
  connected: "Connected",
  "not-connected": "Not connected",
  "coming-soon": "Coming soon",
}

export function IntegrationSettings() {
  const demoMode = useDemoMode()
  const { integrations, setStatus } = useIntegrations()

  if (!demoMode) {
    return (
      <RealSettingsPointer
        icon={Plug}
        title="APIs & Integrations"
        description="Connect and manage every real provider (Facebook, Instagram, WhatsApp, Gemini, and more) from the dedicated Integrations page."
        href="/dashboard/integrations"
        cta="Go to Integrations"
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {integrations.map((integration) => (
        <Card key={integration.id} className="gap-3 px-4 py-4">
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-medium text-foreground">{integration.name}</span>
            <StatusBadge tone={STATUS_TONE[integration.status]}>{STATUS_LABEL[integration.status]}</StatusBadge>
          </div>
          <p className="text-xs text-muted-foreground">{integration.description}</p>
          {integration.status !== "coming-soon" && (
            <Button
              variant={integration.status === "connected" ? "outline" : "default"}
              size="sm"
              className="mt-1 w-fit"
              onClick={() => setStatus(integration.id, integration.status === "connected" ? "not-connected" : "connected")}
            >
              {integration.status === "connected" ? "Disconnect" : "Connect"}
            </Button>
          )}
        </Card>
      ))}
    </div>
  )
}
