import type { Metadata } from "next"
import { InboxContent } from "@/components/inbox/inbox-content"

export const metadata: Metadata = { title: "Social Inbox — EasyLife" }

export default function SocialInboxPage() {
  return <InboxContent />
}
