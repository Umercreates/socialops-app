import type { Metadata } from "next"
import { CommentsPageContent } from "@/components/comments/comments-page-content"
import { RealCommentsPageContent } from "@/components/comments/real-comments-page-content"
import { getDashboardViewMode } from "@/lib/dashboard-view-mode"

export const metadata: Metadata = { title: "Comments — EasyLife" }

export default async function CommentsPage() {
  const viewMode = await getDashboardViewMode()
  return viewMode === "client" ? <RealCommentsPageContent /> : <CommentsPageContent />
}
