import type { Metadata } from "next"
import { IntegrationsPageContent } from "@/components/integrations/integrations-page-content"
import { DemoIntegrationsPageContent } from "@/components/integrations/demo-integrations-page-content"
import { getDashboardViewMode } from "@/lib/dashboard-view-mode"

export const metadata: Metadata = { title: "APIs & Integrations — EasyLife" }

export default async function IntegrationsPage() {
  const viewMode = await getDashboardViewMode()
  return viewMode === "client" ? <IntegrationsPageContent /> : <DemoIntegrationsPageContent />
}
