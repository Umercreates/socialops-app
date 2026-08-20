import type { Metadata } from "next"
import { PublishedPostsContent } from "@/components/published/published-posts-content"
import { DemoPublishedPostsContent } from "@/components/published/demo-published-posts-content"
import { getDashboardViewMode } from "@/lib/dashboard-view-mode"

export const metadata: Metadata = { title: "Published Posts — EasyLife" }

export default async function PublishedPostsPage() {
  const viewMode = await getDashboardViewMode()
  return viewMode === "client" ? <PublishedPostsContent /> : <DemoPublishedPostsContent />
}
