import type { Metadata } from "next"
import { ScheduledPostsContent } from "@/components/scheduled/scheduled-posts-content"

export const metadata: Metadata = { title: "Scheduled Posts — EasyLife" }

export default function ScheduledPostsPage() {
  return <ScheduledPostsContent />
}
