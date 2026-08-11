import type { PostStatus } from "@/types"
import type { StatusTone } from "@/components/dashboard/status-badge"

export const POST_STATUS_TONE: Record<PostStatus, StatusTone> = {
  draft: "neutral",
  scheduled: "info",
  published: "success",
  failed: "error",
}

export const POST_STATUS_LABEL: Record<PostStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  published: "Published",
  failed: "Failed",
}
