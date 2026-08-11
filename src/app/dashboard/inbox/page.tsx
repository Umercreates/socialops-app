import type { Metadata } from "next"
import { InboxContent } from "@/components/inbox/inbox-content"

export const metadata: Metadata = { title: "Social Inbox — Easyland" }

export default function SocialInboxPage() {
  return <InboxContent />
}
