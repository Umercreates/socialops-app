import { ThumbsUp, ThumbsDown, HelpCircle, Minus, type LucideIcon } from "lucide-react"
import type { CommentSentiment } from "@/types"
import type { StatusTone } from "@/components/dashboard/status-badge"

export const SENTIMENT_ICON: Record<CommentSentiment, LucideIcon> = {
  positive: ThumbsUp,
  negative: ThumbsDown,
  question: HelpCircle,
  neutral: Minus,
}

export const SENTIMENT_TONE: Record<CommentSentiment, StatusTone> = {
  positive: "success",
  negative: "error",
  question: "info",
  neutral: "neutral",
}

export const SENTIMENT_LABEL: Record<CommentSentiment, string> = {
  positive: "Positive",
  negative: "Negative",
  question: "Question",
  neutral: "Neutral",
}
