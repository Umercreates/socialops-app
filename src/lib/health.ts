import type { ConnectionHealth } from "@/types"
import type { StatusTone } from "@/components/dashboard/status-badge"

export const HEALTH_TONE: Record<ConnectionHealth, StatusTone> = {
  connected: "success",
  attention: "warning",
  expired: "error",
  disconnected: "neutral",
}

export const HEALTH_LABEL: Record<ConnectionHealth, string> = {
  connected: "Connected",
  attention: "Needs attention",
  expired: "Expired",
  disconnected: "Disconnected",
}
