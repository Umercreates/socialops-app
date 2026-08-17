import type { Metadata } from "next"
import { InboxContent } from "@/components/inbox/inbox-content"
import { RealInboxContent } from "@/components/inbox/real-inbox-content"

export const metadata: Metadata = { title: "Social Inbox — EasyLife" }

export default function SocialInboxPage() {
  const crmMode = process.env.CRM_MODE === "database" ? "database" : "demo"
  return crmMode === "database" ? <RealInboxContent /> : <InboxContent />
}
