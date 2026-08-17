import type { Metadata } from "next"
import { CommentsPageContent } from "@/components/comments/comments-page-content"
import { RealCommentsPageContent } from "@/components/comments/real-comments-page-content"

export const metadata: Metadata = { title: "Comments — EasyLife" }

export default function CommentsPage() {
  const crmMode = process.env.CRM_MODE === "database" ? "database" : "demo"
  return crmMode === "database" ? <RealCommentsPageContent /> : <CommentsPageContent />
}
