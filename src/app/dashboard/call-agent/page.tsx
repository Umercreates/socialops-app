import type { Metadata } from "next"
import { CallAgentPageContent } from "@/components/call-agent/call-agent-page-content"
import { RealCallAgentPageContent } from "@/components/call-agent/real/real-call-agent-page-content"

export const metadata: Metadata = { title: "Call Agent — EasyLife" }

export default function CallAgentPage() {
  const crmMode = process.env.CRM_MODE === "database" ? "database" : "demo"
  return crmMode === "database" ? <RealCallAgentPageContent /> : <CallAgentPageContent />
}
