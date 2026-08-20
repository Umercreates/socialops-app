import type { Metadata } from "next"
import { CallAgentPageContent } from "@/components/call-agent/call-agent-page-content"
import { RealCallAgentPageContent } from "@/components/call-agent/real/real-call-agent-page-content"
import { getDashboardViewMode } from "@/lib/dashboard-view-mode"

export const metadata: Metadata = { title: "Call Agent — EasyLife" }

export default async function CallAgentPage() {
  const viewMode = await getDashboardViewMode()
  return viewMode === "client" ? <RealCallAgentPageContent /> : <CallAgentPageContent />
}
