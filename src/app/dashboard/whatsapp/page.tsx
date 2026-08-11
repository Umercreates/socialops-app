import type { Metadata } from "next"
import { WhatsAppPageContent } from "@/components/whatsapp/whatsapp-page-content"

export const metadata: Metadata = { title: "WhatsApp — Easyland" }

export default function WhatsAppPage() {
  return <WhatsAppPageContent />
}
