import type { Metadata } from "next"
import { IntegrationsPageContent } from "@/components/integrations/integrations-page-content"

export const metadata: Metadata = { title: "APIs & Integrations — EasyLife" }

export default function IntegrationsPage() {
  return <IntegrationsPageContent />
}
