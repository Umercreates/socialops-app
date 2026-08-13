import type { Metadata } from "next"
import { CallAgentPageContent } from "@/components/call-agent/call-agent-page-content"

export const metadata: Metadata = { title: "Call Agent — EasyLife" }

export default function CallAgentPage() {
  return <CallAgentPageContent />
}
