import type { Metadata } from "next"
import { CommentsPageContent } from "@/components/comments/comments-page-content"

export const metadata: Metadata = { title: "Comments — EasyLife" }

export default function CommentsPage() {
  return <CommentsPageContent />
}
