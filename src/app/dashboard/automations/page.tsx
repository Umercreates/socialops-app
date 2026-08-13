import type { Metadata } from "next"
import { AutomationsPageContent } from "@/components/automations/automations-page-content"

export const metadata: Metadata = { title: "Automations — EasyLife" }

export default function AutomationsPage() {
  return <AutomationsPageContent />
}
