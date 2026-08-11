import { cn } from "@/lib/utils"

export type StatusTone = "success" | "warning" | "error" | "info" | "neutral"

const TONE_CLASSES: Record<StatusTone, string> = {
  success: "bg-success/10 text-success dark:bg-success/15",
  warning: "bg-warning/15 text-warning-foreground dark:bg-warning/20 dark:text-warning",
  error: "bg-destructive/10 text-destructive dark:bg-destructive/20",
  info: "bg-brand/10 text-brand dark:bg-brand/15",
  neutral: "bg-muted text-muted-foreground",
}

const DOT_CLASSES: Record<StatusTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-destructive",
  info: "bg-brand",
  neutral: "bg-muted-foreground",
}

interface StatusBadgeProps {
  tone: StatusTone
  children: React.ReactNode
  className?: string
}

/** Status is always conveyed by dot + label together, never color alone. */
export function StatusBadge({ tone, children, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center gap-1.5 rounded-full px-2 text-xs font-medium whitespace-nowrap",
        TONE_CLASSES[tone],
        className
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", DOT_CLASSES[tone])} aria-hidden="true" />
      {children}
    </span>
  )
}
