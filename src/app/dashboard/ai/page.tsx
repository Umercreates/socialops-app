import type { Metadata } from "next"
import { AiAssistantContent } from "@/components/ai/ai-assistant-content"
import { getDashboardViewMode } from "@/lib/dashboard-view-mode"

export const metadata: Metadata = { title: "AI Assistant — EasyLife" }

export default async function AiAssistantPage() {
  const viewMode = await getDashboardViewMode()
  // Keying by mode forces a full remount on a Demo <-> Client switch, so a
  // typed demo chat transcript can never remain visible after switching to
  // Client Mode - AiChat is shared, not Demo/Real-split.
  return <AiAssistantContent key={viewMode} />
}
