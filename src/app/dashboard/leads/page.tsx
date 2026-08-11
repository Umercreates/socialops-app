import type { Metadata } from "next"
import { LeadsPageContent } from "@/components/leads/leads-page-content"

export const metadata: Metadata = { title: "Leads / CRM — Easyland" }

export default function LeadsPage() {
  return <LeadsPageContent />
}
