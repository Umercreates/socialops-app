import { PlatformIcon, PLATFORM_LABEL } from "@/components/dashboard/platform-icon"
import type { PlatformPublishPerformance } from "@/lib/platform/business-analytics"
import type { SocialPlatform } from "@/types"

const PLATFORM_BAR_COLOR: Record<string, string> = {
  instagram: "#c2377b",
  facebook: "#1877f2",
  linkedin: "#0a66c2",
  tiktok: "#1a7a75",
  youtube: "#d0302f",
  x: "var(--foreground)",
}

/** Real per-platform publish success rate, computed from this workspace's
 * own post_targets rows - the honest replacement for the old fake "reach"
 * bars (no platform's organic reach/impressions API is integrated). */
export function RealPlatformPerformanceBars({ data }: { data: PlatformPublishPerformance[] }) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No posts published yet.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {data.map((item) => (
        <div key={item.platform} className="flex items-center gap-3">
          <span className="flex w-24 shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
            <PlatformIcon platform={item.platform as SocialPlatform} accent size={13} />
            {PLATFORM_LABEL[item.platform as SocialPlatform] ?? item.platform}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{ width: `${item.successRate}%`, backgroundColor: PLATFORM_BAR_COLOR[item.platform] ?? "var(--brand)" }}
            />
          </div>
          <span className="w-16 shrink-0 text-right text-xs font-medium tabular-nums text-foreground">{item.published} published</span>
          <span className="w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{item.successRate}%</span>
        </div>
      ))}
    </div>
  )
}
