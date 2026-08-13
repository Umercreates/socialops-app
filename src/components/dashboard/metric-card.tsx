import type { ReactNode } from "react"
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { formatSigned, formatSignedCompact } from "@/lib/format"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  icon: LucideIcon
  label: string
  value: ReactNode
  delta?: {
    value: number
    suffix?: string
    decimals?: number
    /** Format the magnitude with compact notation (13.3K) instead of a fixed decimal. */
    compact?: boolean
    /** Whether an upward move is the desired direction for this metric. */
    upIsGood?: boolean
  }
  caption?: string
}

export function MetricCard({ icon: Icon, label, value, delta, caption }: MetricCardProps) {
  return (
    <Card className="gap-3 px-4 py-4">
      <div className="flex items-center justify-between">
        <span className="flex size-8 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-4 text-muted-foreground" strokeWidth={1.75} />
        </span>
        {delta && <DeltaChip {...delta} />}
      </div>
      <div className="flex flex-col gap-0.5 px-0.5">
        <span className="text-2xl font-semibold tabular-nums text-foreground">{value}</span>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      {caption && <span className="px-0.5 text-xs text-muted-foreground/80">{caption}</span>}
    </Card>
  )
}

function DeltaChip({
  value,
  suffix = "%",
  decimals = 1,
  compact = false,
  upIsGood = true,
}: NonNullable<MetricCardProps["delta"]>) {
  if (Math.abs(value) < (compact ? 1 : 0.05)) {
    return (
      <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
        Flat
      </span>
    )
  }

  const direction = value > 0 ? "up" : "down"
  const isPositiveOutcome = direction === "up" ? upIsGood : !upIsGood
  const Icon = direction === "up" ? TrendingUp : TrendingDown
  const label = compact ? `${formatSignedCompact(value)}${suffix}` : formatSigned(value, { suffix, decimals })

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums",
        isPositiveOutcome ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
      )}
    >
      <Icon className="size-3" strokeWidth={2} />
      {label}
    </span>
  )
}
