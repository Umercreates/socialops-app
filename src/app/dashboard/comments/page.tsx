import type { Metadata } from "next"
import { CommentsPageContent } from "@/components/comments/comments-page-content"

export const metadata: Metadata = { title: "Comments — Easyland" }

export default function CommentsPage() {
  return <CommentsPageContent />
}
