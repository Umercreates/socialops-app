import { Users, MessagesSquare, PhoneCall, UserCheck2, Target, CalendarCheck2, Trophy } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SecondaryStatStrip, type SecondaryStat } from "@/components/dashboard/secondary-stat-strip"
import { formatCompactNumber } from "@/lib/format"
import type { BusinessAnalyticsOverview } from "@/lib/platform/business-analytics"

interface FunnelStage {
  label: string
  value: number
}

/** Real counterpart to SalesFunnelSection — every stage is a genuine count
 * from the leads/calls/meetings tables (see getBusinessAnalytics), not
 * demo-store lengths. "Social media" reach and "DM" volume are left out of
 * the funnel bars themselves (no real follower-reach or DM-volume source
 * exists yet); the funnel starts at the first stage this app can actually
 * measure — leads captured. */
export function RealSalesFunnelSection({ analytics, whatsappConversationCount }: { analytics: BusinessAnalyticsOverview; whatsappConversationCount: number }) {
  const byStage = (stage: string) => analytics.leads.byStage.find((s) => s.key === stage)?.count ?? 0
  const qualified = analytics.leads.qualified
  const readyForSales = byStage("ready-for-sales") + byStage("human-followup") + byStage("meeting-booked") + byStage("won") + byStage("lost")

  const stats: SecondaryStat[] = [
    { icon: Users, label: "Total leads", value: formatCompactNumber(analytics.leads.total) },
    { icon: MessagesSquare, label: "WhatsApp conversations", value: formatCompactNumber(whatsappConversationCount) },
    { icon: Target, label: "Qualified leads", value: formatCompactNumber(qualified) },
    { icon: PhoneCall, label: "AI calls", value: formatCompactNumber(analytics.calls.total) },
    { icon: UserCheck2, label: "Ready for sales", value: formatCompactNumber(readyForSales) },
    { icon: CalendarCheck2, label: "Meetings booked", value: formatCompactNumber(analytics.meetings.total) },
    { icon: Trophy, label: "Won customers", value: formatCompactNumber(analytics.leads.won) },
  ]

  const stages: FunnelStage[] = [
    { label: "Leads captured", value: analytics.leads.total },
    { label: "WhatsApp", value: whatsappConversationCount },
    { label: "AI qualified", value: qualified },
    { label: "AI call", value: analytics.calls.total },
    { label: "Ready for sales", value: readyForSales },
    { label: "Meeting", value: analytics.meetings.total },
    { label: "Won", value: analytics.leads.won },
  ]
  const maxValue = Math.max(...stages.map((s) => s.value), 1)
  const pct = (num: number, den: number) => (den === 0 ? 0 : Math.round((num / den) * 100))

  return (
    <Card className="gap-4 px-4 py-4 sm:px-5 sm:py-5">
      <CardHeader className="px-0">
        <CardTitle className="text-[15px]">Sales operating funnel</CardTitle>
        <p className="text-xs text-muted-foreground">Leads → WhatsApp → AI Qualified → AI Call → Ready for Sales → Meeting → Won.</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 px-0">
        <SecondaryStatStrip stats={stats} />

        {analytics.leads.total === 0 ? (
          <div className="flex flex-col items-center gap-1 border-t border-border py-8 pt-8 text-center">
            <p className="text-sm text-muted-foreground">No leads yet — the funnel fills in as leads come in.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 border-t border-border pt-4">
            {stages.map((stage, index) => {
              const prev = index > 0 ? stages[index - 1] : null
              const width = Math.max(4, Math.round((stage.value / maxValue) * 100))
              return (
                <div key={stage.label} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 text-xs text-muted-foreground">{stage.label}</span>
                  <div className="h-2 min-w-6 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-brand transition-[width] duration-700 ease-out" style={{ width: `${width}%` }} />
                  </div>
                  <span className="w-14 shrink-0 text-right text-xs font-medium tabular-nums text-foreground">
                    {formatCompactNumber(stage.value)}
                  </span>
                  <span className="w-16 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                    {prev ? `${pct(stage.value, prev.value)}%` : ""}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
