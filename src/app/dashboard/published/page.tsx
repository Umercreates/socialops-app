import type { Metadata } from "next"
import { PublishedPostsContent } from "@/components/published/published-posts-content"

export const metadata: Metadata = { title: "Published Posts — Easyland" }

export default function PublishedPostsPage() {
  return <PublishedPostsContent />
}
