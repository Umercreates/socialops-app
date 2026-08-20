import type { Metadata } from "next"
import { AutomationsPageContent } from "@/components/automations/automations-page-content"
import { DemoAutomationsPageContent } from "@/components/automations/demo-automations-page-content"
import { getDashboardViewMode } from "@/lib/dashboard-view-mode"

export const metadata: Metadata = { title: "Automations — EasyLife" }

export default async function AutomationsPage() {
  const viewMode = await getDashboardViewMode()
  return viewMode === "client" ? <AutomationsPageContent /> : <DemoAutomationsPageContent />
}
