"use client"

import { MessageCircle, Target } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConnectionCard } from "@/components/whatsapp/connection-card"
import { QrLinkCard } from "@/components/whatsapp/qr-link-card"
import { ChatbotDemo } from "@/components/whatsapp/chatbot-demo"
import { LeadInboxList } from "@/components/whatsapp/lead-inbox-list"
import { WhatsAppIcon } from "@/components/whatsapp/whatsapp-icon"
import { LEAD_STAGE_ORDER } from "@/lib/lead-status"
import { formatCompactNumber } from "@/lib/format"
import { useLeads } from "@/lib/store/leads-store"

export function WhatsAppPageContent() {
  const { leads } = useLeads()
  const whatsappLeads = leads.filter((l) => l.whatsappNumber)
  const qualifiedIndex = LEAD_STAGE_ORDER.indexOf("qualified")
  const qualifiedLeads = whatsappLeads.filter((l) => LEAD_STAGE_ORDER.indexOf(l.stage) >= qualifiedIndex)

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-1">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground">
          <WhatsAppIcon size={20} />
          WhatsApp
        </h2>
        <p className="text-sm text-muted-foreground">
          One Easyland WhatsApp Business number — from QR scan to AI-qualified lead, all in one place.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
        <div className="flex items-center gap-2.5 rounded-xl bg-card px-3.5 py-3 ring-1 ring-foreground/10">
          <MessageCircle className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
          <div className="flex min-w-0 flex-col">
            <span className="text-base font-semibold text-foreground">{formatCompactNumber(whatsappLeads.length)}</span>
            <span className="truncate text-xs text-muted-foreground">Leads received</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl bg-card px-3.5 py-3 ring-1 ring-foreground/10">
          <Target className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
          <div className="flex min-w-0 flex-col">
            <span className="text-base font-semibold text-foreground">{formatCompactNumber(qualifiedLeads.length)}</span>
            <span className="truncate text-xs text-muted-foreground">Qualified leads</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="connection">
        <TabsList className="max-w-full overflow-x-auto">
          <TabsTrigger value="connection">Connection</TabsTrigger>
          <TabsTrigger value="qr">QR & Link</TabsTrigger>
          <TabsTrigger value="chatbot">Chatbot Demo</TabsTrigger>
          <TabsTrigger value="inbox">Lead Inbox</TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="pt-4">
          <ConnectionCard />
        </TabsContent>

        <TabsContent value="qr" className="pt-4">
          <QrLinkCard />
        </TabsContent>

        <TabsContent value="chatbot" className="pt-4">
          <ChatbotDemo />
        </TabsContent>

        <TabsContent value="inbox" className="pt-4">
          <LeadInboxList />
        </TabsContent>
      </Tabs>
    </div>
  )
}
