"use client"

import * as React from "react"
import { Users, MessagesSquare, PhoneCall, UserCheck2, Target, CalendarCheck2, Trophy } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SecondaryStatStrip, type SecondaryStat } from "@/components/dashboard/secondary-stat-strip"
import { formatCompactNumber } from "@/lib/format"
import { LEAD_STAGE_ORDER } from "@/lib/lead-status"
import { useLeads } from "@/lib/store/leads-store"
import { useCalls } from "@/lib/store/calls-store"
import { useMeetings } from "@/lib/store/meetings-store"
import { useComments } from "@/lib/store/comments-store"
import { useConversations } from "@/lib/store/conversations-store"

interface FunnelStage {
  label: string
  value: number
}

export function SalesFunnelSection({ totalFollowers }: { totalFollowers: number }) {
  const { leads } = useLeads()
  const { calls } = useCalls()
  const { meetings } = useMeetings()
  const { comments } = useComments()
  const { conversations } = useConversations()

  const whatsappLeads = leads.filter((l) => Boolean(l.whatsappNumber))
  const interestedLeads = leads.filter((l) => l.status === "interested")
  const qualifiedIndex = LEAD_STAGE_ORDER.indexOf("qualified")
  const qualifiedLeads = leads.filter((l) => LEAD_STAGE_ORDER.indexOf(l.stage) >= qualifiedIndex)
  const readyForSalesIndex = LEAD_STAGE_ORDER.indexOf("ready-for-sales")
  const humanHandoffs = leads.filter((l) => LEAD_STAGE_ORDER.indexOf(l.stage) >= readyForSalesIndex)
  const customers = leads.filter((l) => l.stage === "won" || l.status === "existing-customer")

  const pct = (num: number, den: number) => (den === 0 ? 0 : Math.round((num / den) * 100))

  const stats: SecondaryStat[] = [
    { icon: Users, label: "Social leads", value: formatCompactNumber(leads.length) },
    { icon: MessagesSquare, label: "WhatsApp conversations", value: formatCompactNumber(whatsappLeads.length) },
    { icon: Target, label: "Interested leads", value: formatCompactNumber(interestedLeads.length) },
    { icon: Target, label: "Qualified leads", value: formatCompactNumber(qualifiedLeads.length) },
    { icon: PhoneCall, label: "AI calls", value: formatCompactNumber(calls.length) },
    { icon: UserCheck2, label: "Human handoffs", value: formatCompactNumber(humanHandoffs.length) },
    { icon: CalendarCheck2, label: "Meetings booked", value: formatCompactNumber(meetings.length) },
    { icon: Trophy, label: "Won customers", value: formatCompactNumber(customers.length) },
  ]

  const stages: FunnelStage[] = [
    { label: "Social media", value: totalFollowers },
    { label: "DM", value: comments.length + conversations.length },
    { label: "WhatsApp", value: whatsappLeads.length },
    { label: "AI qualified", value: qualifiedLeads.length },
    { label: "AI call", value: calls.length },
    { label: "Ready for sales", value: humanHandoffs.length },
    { label: "Meeting", value: meetings.length },
    { label: "Customer", value: customers.length },
  ]
  const maxValue = Math.max(...stages.map((s) => s.value), 1)

  return (
    <Card className="gap-4 px-4 py-4 sm:px-5 sm:py-5">
      <CardHeader className="px-0">
        <CardTitle className="text-[15px]">Sales operating funnel</CardTitle>
        <p className="text-xs text-muted-foreground">Social Media → DM → WhatsApp → AI Qualified → AI Call → Ready for Sales → Meeting → Customer.</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 px-0">
        <SecondaryStatStrip stats={stats} />

        <div className="flex flex-col gap-2.5 border-t border-border pt-4">
          {stages.map((stage, index) => {
            const prev = index > 0 ? stages[index - 1] : null
            const width = Math.max(4, Math.round((stage.value / maxValue) * 100))
            return (
              <div key={stage.label} className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-xs text-muted-foreground">{stage.label}</span>
                <div className="h-2 min-w-6 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${width}%` }} />
                </div>
                <span className="w-14 shrink-0 text-right text-xs font-medium tabular-nums text-foreground">{formatCompactNumber(stage.value)}</span>
                <span className="w-16 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                  {prev ? `${pct(stage.value, prev.value)}%` : ""}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
