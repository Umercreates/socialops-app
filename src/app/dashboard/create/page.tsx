import type { Metadata } from "next"
import { Composer } from "@/components/composer/composer"

export const metadata: Metadata = { title: "Create Post — Easyland" }

export default function CreatePostPage() {
  return <Composer />
}
