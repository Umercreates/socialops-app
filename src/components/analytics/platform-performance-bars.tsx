"use client"

import { PlatformIcon, PLATFORM_LABEL } from "@/components/dashboard/platform-icon"
import { formatCompactNumber } from "@/lib/format"
import type { PlatformPerformance } from "@/types"

const PLATFORM_BAR_COLOR: Record<string, string> = {
  instagram: "#c2377b",
  facebook: "#1877f2",
  linkedin: "#0a66c2",
  tiktok: "#1a7a75",
  youtube: "#d0302f",
  x: "var(--foreground)",
}

export function PlatformPerformanceBars({ data }: { data: PlatformPerformance[] }) {
  const max = Math.max(...data.map((d) => d.reach), 1)

  return (
    <div className="flex flex-col gap-3">
      {data.map((item) => (
        <div key={item.platform} className="flex items-center gap-3">
          <span className="flex w-24 shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
            <PlatformIcon platform={item.platform} accent size={13} />
            {PLATFORM_LABEL[item.platform]}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{ width: `${(item.reach / max) * 100}%`, backgroundColor: PLATFORM_BAR_COLOR[item.platform] }}
            />
          </div>
          <span className="w-16 shrink-0 text-right text-xs font-medium tabular-nums text-foreground">
            {formatCompactNumber(item.reach)}
          </span>
          <span className="w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{item.engagementRate}%</span>
        </div>
      ))}
    </div>
  )
}
