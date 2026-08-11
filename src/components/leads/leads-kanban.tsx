"use client"

import * as React from "react"
import { ArrowRight } from "lucide-react"
import { LeadScoreBadge } from "@/components/leads/lead-score-badge"
import { LeadProfileDrawer } from "@/components/leads/lead-profile-drawer"
import { PlatformIcon, PLATFORM_LABEL } from "@/components/dashboard/platform-icon"
import { WhatsAppIcon } from "@/components/whatsapp/whatsapp-icon"
import { LEAD_STAGE_ORDER, LEAD_STAGE_LABEL } from "@/lib/lead-status"
import { formatRelativeTime } from "@/lib/format"
import { MOCK_NOW } from "@/lib/data/constants"
import { useLeads } from "@/lib/store/leads-store"
import type { Lead, SocialPlatform } from "@/types"
import { cn } from "@/lib/utils"

const SOCIAL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "youtube", "x"]
function isSocialPlatform(platform: Lead["source"]["platform"]): platform is SocialPlatform {
  return (SOCIAL_PLATFORMS as string[]).includes(platform)
}

function LeadCard({ lead, onOpen }: { lead: Lead; onOpen: (leadId: string) => void }) {
  const { setStage } = useLeads()
  const stageIndex = LEAD_STAGE_ORDER.indexOf(lead.stage)
  const nextStage = stageIndex >= 0 && stageIndex < LEAD_STAGE_ORDER.length - 2 ? LEAD_STAGE_ORDER[stageIndex + 1] : null

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-card p-3 ring-1 ring-foreground/10">
      <button type="button" onClick={() => onOpen(lead.id)} className="flex flex-col gap-1.5 text-left">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-medium text-foreground">{lead.name}</span>
          <LeadScoreBadge score={lead.score} />
        </div>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {lead.whatsappNumber ? (
            <WhatsAppIcon size={11} />
          ) : isSocialPlatform(lead.source.platform) ? (
            <PlatformIcon platform={lead.source.platform} size={11} />
          ) : null}
          {lead.whatsappNumber ?? (isSocialPlatform(lead.source.platform) ? PLATFORM_LABEL[lead.source.platform] : lead.source.platform)}
        </span>
        <span className="text-[11px] text-muted-foreground">{formatRelativeTime(lead.lastInteractionAt, MOCK_NOW)}</span>
      </button>
      {nextStage && (
        <button
          type="button"
          onClick={() => setStage(lead.id, nextStage)}
          className="flex items-center justify-center gap-1 self-start rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Move to {LEAD_STAGE_LABEL[nextStage]}
          <ArrowRight className="size-3" />
        </button>
      )}
    </div>
  )
}

export function LeadsKanban({ leads }: { leads: Lead[] }) {
  const { leads: allLeads } = useLeads()
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const selected = allLeads.find((l) => l.id === selectedId) ?? null

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {LEAD_STAGE_ORDER.map((stage) => {
          const stageLeads = leads.filter((l) => l.stage === stage).sort((a, b) => b.score - a.score)
          return (
            <div key={stage} className="flex w-64 shrink-0 flex-col gap-2.5 rounded-xl bg-muted/40 p-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-foreground">{LEAD_STAGE_LABEL[stage]}</span>
                <span className={cn("rounded-full bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground", stageLeads.length === 0 && "opacity-50")}>
                  {stageLeads.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {stageLeads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} onOpen={setSelectedId} />
                ))}
                {stageLeads.length === 0 && <p className="px-1 text-[11px] text-muted-foreground/70">No leads</p>}
              </div>
            </div>
          )
        })}
      </div>
      <LeadProfileDrawer lead={selected} onOpenChange={(open) => !open && setSelectedId(null)} />
    </>
  )
}
