"use client"

import * as React from "react"
import { QRCodeSVG } from "qrcode.react"
import { Copy, ExternalLink, Check } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { WhatsAppIcon } from "@/components/whatsapp/whatsapp-icon"
import { buildClickToChatLink, fillMessageTemplate } from "@/lib/integrations/whatsapp"
import { useWhatsAppAccount, useWhatsAppCta } from "@/lib/store/whatsapp-store"
import { WHATSAPP_MESSAGE_VARIABLES } from "@/types"

const SAMPLE_VALUES: Record<string, string> = {
  name: "Alex",
  platform: "Instagram",
  campaign: "Fall Collection",
  post: "Studio Lookbook",
  service: "business setup",
  source: "organic",
}

export function QrLinkCard() {
  const { account } = useWhatsAppAccount()
  const { ctaMessage, setCtaMessage } = useWhatsAppCta()
  const [copied, setCopied] = React.useState(false)

  const filledMessage = fillMessageTemplate(ctaMessage, SAMPLE_VALUES)
  const link = buildClickToChatLink(account.number, filledMessage)

  function insertVariable(variable: string) {
    setCtaMessage((prev) => `${prev}{{${variable}}}`)
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Card className="gap-4 px-5 py-5">
      <CardHeader className="px-0">
        <CardTitle className="text-[15px]">WhatsApp click-to-chat link + QR</CardTitle>
        <p className="text-xs text-muted-foreground">
          Real, working <code className="rounded bg-muted px-1 py-0.5">wa.me</code> links — no API required. Always opens EasyLife&apos;s WhatsApp.
        </p>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-6 px-0 lg:grid-cols-[1fr_16rem]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cta-message">Prefilled message</Label>
            <Textarea
              id="cta-message"
              value={ctaMessage}
              onChange={(event) => setCtaMessage(event.target.value)}
              className="min-h-20 resize-none"
            />
            <div className="flex flex-wrap gap-1.5">
              {WHATSAPP_MESSAGE_VARIABLES.map((variable) => (
                <button
                  key={variable}
                  type="button"
                  onClick={() => insertVariable(variable)}
                  className="rounded-full border border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground hover:border-ring/50 hover:text-foreground"
                >
                  {`{{${variable}}}`}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Preview with sample values: “{filledMessage}”</p>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
            <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{link}</span>
            <Button type="button" variant="ghost" size="icon-sm" onClick={handleCopy} aria-label="Copy link">
              {copied ? <Check className="text-success" /> : <Copy />}
            </Button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 rounded-xl bg-muted/40 p-5 text-center">
          <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <WhatsAppIcon size={16} />
            Scan to continue on WhatsApp
          </span>
          <div className="rounded-lg bg-white p-3 ring-1 ring-border">
            <QRCodeSVG value={link} size={148} level="M" marginSize={0} />
          </div>
          <span className="text-xs text-muted-foreground">{account.number}</span>
          <Button render={<a href={link} target="_blank" rel="noopener noreferrer" />} nativeButton={false} size="sm" className="w-full">
            <WhatsAppIcon size={14} />
            Open WhatsApp
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
