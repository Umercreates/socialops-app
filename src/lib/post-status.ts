import type { PostStatus } from "@/types"
import type { StatusTone } from "@/components/dashboard/status-badge"

export const POST_STATUS_TONE: Record<PostStatus, StatusTone> = {
  draft: "neutral",
  scheduled: "info",
  publishing: "info",
  published: "success",
  partially_failed: "warning",
  failed: "error",
}

export const POST_STATUS_LABEL: Record<PostStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  publishing: "Publishing…",
  published: "Published",
  partially_failed: "Partially failed",
  failed: "Failed",
}
