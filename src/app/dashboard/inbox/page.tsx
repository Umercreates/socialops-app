import type { Metadata } from "next"
import { InboxContent } from "@/components/inbox/inbox-content"
import { RealInboxContent } from "@/components/inbox/real-inbox-content"
import { getDashboardViewMode } from "@/lib/dashboard-view-mode"

export const metadata: Metadata = { title: "Social Inbox — EasyLife" }

export default async function SocialInboxPage() {
  const viewMode = await getDashboardViewMode()
  return viewMode === "client" ? <RealInboxContent /> : <InboxContent />
}
