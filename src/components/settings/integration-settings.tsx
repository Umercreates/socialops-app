"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/dashboard/status-badge"
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
  const { integrations, setStatus } = useIntegrations()

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
