"use client"

import { ShieldCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ConnectionCard } from "@/components/whatsapp/connection-card"
import { QrLinkCard } from "@/components/whatsapp/qr-link-card"
import { useWhatsAppAiSettings } from "@/lib/store/whatsapp-store"

export function WhatsAppSettings() {
  const { aiSettings, update } = useWhatsAppAiSettings()

  return (
    <div className="flex flex-col gap-5">
      <ConnectionCard />
      <QrLinkCard />

      <Card className="gap-4 px-5 py-5">
        <CardHeader className="px-0">
          <CardTitle className="flex items-center gap-1.5 text-[15px]">
            <ShieldCheck className="size-4" />
            AI reply & qualification
          </CardTitle>
          <p className="text-xs text-muted-foreground">Controls how the AI behaves once a lead reaches WhatsApp.</p>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-border px-0">
          <ToggleRow
            label="AI auto-reply"
            description="Let the AI respond to inbound WhatsApp messages automatically."
            checked={aiSettings.aiReplyEnabled}
            onCheckedChange={(v) => update({ aiReplyEnabled: v })}
          />
          <ToggleRow
            label="AI qualification"
            description="Let the AI collect requirement, budget, timeline, and service interest naturally in conversation."
            checked={aiSettings.qualificationEnabled}
            onCheckedChange={(v) => update({ qualificationEnabled: v })}
          />
          <ToggleRow
            label="Human approval before sending"
            description="Hold AI-drafted replies for a teammate to approve before they go out."
            checked={aiSettings.humanApprovalRequired}
            onCheckedChange={(v) => update({ humanApprovalRequired: v })}
          />
          <ToggleRow
            label="Escalate to human on request"
            description="Hand the conversation to a teammate if the lead asks for a human or the AI can't help."
            checked={aiSettings.escalationEnabled}
            onCheckedChange={(v) => update({ escalationEnabled: v })}
          />
          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="flex flex-col">
              <Label className="text-sm font-normal text-foreground">Business hours</Label>
              <p className="text-xs text-muted-foreground">Outside these hours, replies are queued for the next business day.</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={aiSettings.businessHoursStart}
                onChange={(event) => update({ businessHoursStart: event.target.value })}
                className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <input
                type="time"
                value={aiSettings.businessHoursEnd}
                onChange={(event) => update({ businessHoursEnd: event.target.value })}
                className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="flex flex-col">
        <Label className="text-sm font-normal text-foreground">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
