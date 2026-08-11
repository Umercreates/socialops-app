import type { Metadata } from "next"
import { AiAssistantContent } from "@/components/ai/ai-assistant-content"

export const metadata: Metadata = { title: "AI Assistant — Easyland" }

export default function AiAssistantPage() {
  return <AiAssistantContent />
}
