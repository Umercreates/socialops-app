import type { Metadata } from "next"
import { ScheduledPostsContent } from "@/components/scheduled/scheduled-posts-content"
import { DemoScheduledPostsContent } from "@/components/scheduled/demo-scheduled-posts-content"
import { getDashboardViewMode } from "@/lib/dashboard-view-mode"

export const metadata: Metadata = { title: "Scheduled Posts — EasyLife" }

export default async function ScheduledPostsPage() {
  const viewMode = await getDashboardViewMode()
  return viewMode === "client" ? <ScheduledPostsContent /> : <DemoScheduledPostsContent />
}
