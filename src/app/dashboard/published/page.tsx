import type { Metadata } from "next"
import { PublishedPostsContent } from "@/components/published/published-posts-content"

export const metadata: Metadata = { title: "Published Posts — EasyLife" }

export default function PublishedPostsPage() {
  return <PublishedPostsContent />
}
