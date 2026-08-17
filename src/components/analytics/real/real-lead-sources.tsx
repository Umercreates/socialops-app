import type { CountBucket } from "@/lib/platform/business-analytics"

const SOURCE_LABEL: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  youtube: "YouTube",
  x: "X",
  whatsapp: "WhatsApp",
  direct: "Direct",
}

/** Real lead source breakdown from leads.source_platform - no provider
 * dependency, this is entirely EasyLife's own data. */
export function RealLeadSources({ bySource }: { bySource: CountBucket[] }) {
  const total = bySource.reduce((sum, s) => sum + s.count, 0)
  const sorted = [...bySource].sort((a, b) => b.count - a.count)

  if (total === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No leads captured yet.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((source) => {
        const pct = total === 0 ? 0 : Math.round((source.count / total) * 100)
        return (
          <div key={source.key} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-xs text-muted-foreground">{SOURCE_LABEL[source.key] ?? source.key}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-10 shrink-0 text-right text-xs font-medium tabular-nums text-foreground">{source.count}</span>
            <span className="w-10 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">{pct}%</span>
          </div>
        )
      })}
    </div>
  )
}
