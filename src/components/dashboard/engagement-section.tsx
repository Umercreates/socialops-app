"use client"

import * as React from "react"
import { Heart, MessageSquare, Repeat2, Eye, Users, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DateRangeFilter } from "@/components/dashboard/date-range-filter"
import { EngagementChart } from "@/components/dashboard/engagement-chart"
import type { DateRangeOption, EngagementPoint, EngagementTotals } from "@/types"
import { formatCompactNumber, formatNumber, formatSigned } from "@/lib/format"
import { cn } from "@/lib/utils"

interface EngagementSectionProps {
  seriesByRange: Record<DateRangeOption, EngagementPoint[]>
  totalsByRange: Record<DateRangeOption, EngagementTotals>
}

const RANGE_LABEL: Record<DateRangeOption, string> = {
  today: "today",
  "7d": "the last 7 days",
  "30d": "the last 30 days",
  "90d": "the last 90 days",
}

export function EngagementSection({ seriesByRange, totalsByRange }: EngagementSectionProps) {
  const [range, setRange] = React.useState<DateRangeOption>("30d")
  const data = seriesByRange[range]
  const totals = totalsByRange[range]

  return (
    <Card className="gap-4 px-4 py-4 sm:px-5 sm:py-5">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 px-0">
        <CardTitle className="text-[15px]">Engagement overview</CardTitle>
        <DateRangeFilter value={range} onChange={setRange} />
      </CardHeader>

      <CardContent className="flex flex-col gap-4 px-0">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-2xl font-semibold text-foreground">{formatCompactNumber(totals.engagements)}</span>
            <span className="text-xs text-muted-foreground">
              Total engagements &middot; {RANGE_LABEL[range]}
            </span>
          </div>
          <DeltaTag value={totals.engagementsDelta} />
        </div>

        <EngagementChart data={data} />

        <div className="grid grid-cols-2 gap-2 border-t border-border pt-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCell icon={Heart} label="Likes" value={totals.likes} delta={totals.likesDelta} />
          <StatCell icon={MessageSquare} label="Comments" value={totals.comments} delta={totals.commentsDelta} />
          <StatCell icon={Repeat2} label="Shares" value={totals.shares} delta={totals.sharesDelta} />
          <StatCell icon={Eye} label="Views" value={totals.views} delta={totals.viewsDelta} />
          <StatCell icon={Users} label="Reach" value={totals.reach} delta={totals.reachDelta} />
        </div>
      </CardContent>
    </Card>
  )
}

function DeltaTag({ value }: { value: number }) {
  if (Math.abs(value) < 0.05) {
    return <span className="text-xs font-medium text-muted-foreground">Flat vs. prior period</span>
  }
  const isPositive = value > 0
  const Icon = isPositive ? TrendingUp : TrendingDown
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums",
        isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
      )}
    >
      <Icon className="size-3" strokeWidth={2} />
      {formatSigned(value, { suffix: "%", decimals: 1 })} vs. prior period
    </span>
  )
}

function StatCell({
  icon: Icon,
  label,
  value,
  delta,
}: {
  icon: typeof Heart
  label: string
  value: number
  delta: number
}) {
  const isFlat = Math.abs(delta) < 0.05
  const isPositive = delta > 0

  return (
    <div className="flex flex-col gap-1 rounded-lg px-2.5 py-2">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" strokeWidth={1.75} />
        {label}
      </span>
      <span className="text-base font-semibold tabular-nums text-foreground" title={formatNumber(value)}>
        {formatCompactNumber(value)}
      </span>
      <span
        className={cn(
          "text-xs tabular-nums",
          isFlat ? "text-muted-foreground" : isPositive ? "text-success" : "text-destructive"
        )}
      >
        {isFlat ? "±0%" : formatSigned(delta, { suffix: "%", decimals: 1 })}
      </span>
    </div>
  )
}
