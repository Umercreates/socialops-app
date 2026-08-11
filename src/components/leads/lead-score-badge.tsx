import { bandForScore } from "@/lib/leads/scoring"
import { cn } from "@/lib/utils"

const TONE_CLASS: Record<string, string> = {
  success: "bg-success/10 text-success",
  info: "bg-brand/10 text-brand",
  warning: "bg-warning/15 text-warning-foreground dark:text-warning",
  neutral: "bg-muted text-muted-foreground",
}

export function LeadScoreBadge({ score, className }: { score: number; className?: string }) {
  const band = bandForScore(score)
  return (
    <span className={cn("inline-flex h-5 shrink-0 items-center gap-1 rounded-full px-2 text-xs font-semibold tabular-nums", TONE_CLASS[band.tone], className)}>
      {score}
      <span className="font-normal opacity-80">· {band.label}</span>
    </span>
  )
}
