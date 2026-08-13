"use client"

import * as React from "react"
import { Loader2, CircleCheck, RefreshCw, Unplug, Pencil, Bot } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { WhatsAppIcon } from "@/components/whatsapp/whatsapp-icon"
import { HEALTH_TONE, HEALTH_LABEL } from "@/lib/health"
import { formatRelativeTime } from "@/lib/format"
import { MOCK_NOW } from "@/lib/data/constants"
import { useWhatsAppAccount, useWhatsAppAiSettings } from "@/lib/store/whatsapp-store"
import { getWhatsAppIntegrationStatus } from "@/lib/integrations/whatsapp"

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(iso))
}

export function ConnectionCard() {
  const { account, connect, disconnect, reconnect, setNumber } = useWhatsAppAccount()
  const { aiSettings } = useWhatsAppAiSettings()
  const integrationStatus = getWhatsAppIntegrationStatus()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [businessName, setBusinessName] = React.useState(account.businessName)
  const [numberDraft, setNumberDraft] = React.useState(account.number)
  const [step, setStep] = React.useState<"form" | "connecting" | "done">("form")
  const [editingNumber, setEditingNumber] = React.useState(false)
  const [numberFieldValue, setNumberFieldValue] = React.useState(account.number)

  async function handleConnect(event: React.FormEvent) {
    event.preventDefault()
    setStep("connecting")
    await connect(businessName, numberDraft)
    setStep("done")
  }

  function saveNumber() {
    if (numberFieldValue.trim()) setNumber(numberFieldValue.trim())
    setEditingNumber(false)
  }

  const health = account.status === "connected" ? "connected" : account.status === "attention" ? "attention" : account.status === "expired" ? "expired" : "disconnected"

  return (
    <Card className="gap-4 px-5 py-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-muted ring-1 ring-border">
            <WhatsAppIcon size={22} />
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">{account.businessName}</span>
            <span className="text-xs text-muted-foreground">WhatsApp Business Cloud API · {integrationStatus.mode === "demo" ? "Demo mode" : "Live"}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <StatusBadge tone={HEALTH_TONE[health]}>{HEALTH_LABEL[health]}</StatusBadge>
          <StatusBadge tone={aiSettings.aiReplyEnabled ? "success" : "neutral"}>
            <Bot className="size-3" />
            Chatbot {aiSettings.aiReplyEnabled ? "active" : "paused"}
          </StatusBadge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 border-t border-border pt-3.5 text-sm sm:grid-cols-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">WhatsApp number</span>
          {editingNumber ? (
            <div className="flex items-center gap-1.5">
              <Input
                value={numberFieldValue}
                onChange={(event) => setNumberFieldValue(event.target.value)}
                onBlur={saveNumber}
                onKeyDown={(event) => event.key === "Enter" && saveNumber()}
                autoFocus
                className="h-7 text-sm"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setNumberFieldValue(account.number)
                setEditingNumber(true)
              }}
              className="flex w-fit items-center gap-1.5 font-medium text-foreground hover:text-brand"
            >
              {account.number}
              <Pencil className="size-3 text-muted-foreground" />
            </button>
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Connected</span>
          <span className="font-medium text-foreground">{account.connectedAt ? formatDate(account.connectedAt) : "—"}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Last sync</span>
          <span className="font-medium text-foreground">{account.lastSyncAt ? formatRelativeTime(account.lastSyncAt, MOCK_NOW) : "—"}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3.5">
        {account.status === "disconnected" ? (
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open)
              if (!open) setStep("form")
            }}
          >
            <DialogTrigger render={<Button size="sm" />}>
              <WhatsAppIcon size={14} />
              Connect
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              {step === "form" && (
                <form onSubmit={handleConnect} className="flex flex-col gap-4">
                  <DialogHeader>
                    <DialogTitle>Connect WhatsApp Business</DialogTitle>
                    <DialogDescription>
                      Simulated for this demo. A real connection runs Meta&apos;s embedded signup flow for the WhatsApp Business Cloud API.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="wa-business-name">Business name</Label>
                    <Input id="wa-business-name" value={businessName} onChange={(event) => setBusinessName(event.target.value)} className="h-9" required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="wa-number">WhatsApp number</Label>
                    <Input id="wa-number" value={numberDraft} onChange={(event) => setNumberDraft(event.target.value)} className="h-9" required />
                  </div>
                  <DialogFooter>
                    <Button type="submit">Connect</Button>
                  </DialogFooter>
                </form>
              )}
              {step === "connecting" && (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <Loader2 className="size-6 animate-spin text-brand" />
                  <p className="text-sm font-medium text-foreground">Connecting WhatsApp Business…</p>
                </div>
              )}
              {step === "done" && (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <div className="flex size-11 items-center justify-center rounded-full bg-success/10">
                    <CircleCheck className="size-5.5 text-success" />
                  </div>
                  <p className="text-sm font-medium text-foreground">WhatsApp Business connected</p>
                  <Button className="mt-2 w-full" onClick={() => setDialogOpen(false)}>
                    Done
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        ) : (
          <>
            <Button size="sm" variant="outline" onClick={reconnect}>
              <RefreshCw />
              Sync now
            </Button>
            <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={disconnect}>
              <Unplug />
              Disconnect
            </Button>
          </>
        )}
      </div>
    </Card>
  )
}
