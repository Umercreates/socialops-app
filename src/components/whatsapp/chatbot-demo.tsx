"use client"

import * as React from "react"
import { Send, RotateCcw, Bot, PhoneCall, CircleCheck, CircleAlert, FileSpreadsheet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { WhatsAppIcon } from "@/components/whatsapp/whatsapp-icon"
import { LeadScoreBadge } from "@/components/leads/lead-score-badge"
import {
  createInitialChatbotState,
  nextChatbotTurn,
  classifyChatbotLead,
  generateDemoWhatsAppNumber,
  type ChatbotState,
} from "@/lib/integrations/whatsapp/chatbot"
import { useLeads, generateLeadId } from "@/lib/store/leads-store"
import { useCallQueue } from "@/lib/store/calls-store"
import { useCallAgentConfig } from "@/lib/store/call-agent-store"
import { useGoogleSheets } from "@/lib/store/sheets-store"
import { nowIso } from "@/lib/data/constants"
import type { Lead } from "@/types"
import { cn } from "@/lib/utils"

interface ChatMessage {
  id: string
  sender: "bot" | "user"
  text: string
}

const GREETING = "Assalam-o-Alaikum! Thanks for reaching out to EasyLife 👋 Are you mainly looking for lead generation, WhatsApp automation, CRM automation, or a complete sales system?"
const QUICK_REPLIES = ["Complete sales system", "Just WhatsApp automation", "Checking pricing"]

function initialMessages(): ChatMessage[] {
  return [{ id: "m0", sender: "bot", text: GREETING }]
}

let msgIdCounter = 0
function nextMsgId(prefix: string) {
  msgIdCounter += 1
  return `${prefix}_${msgIdCounter}`
}

export function ChatbotDemo() {
  const { addLead, markSheetSynced } = useLeads()
  const { addToQueue } = useCallQueue()
  const { config } = useCallAgentConfig()
  const { syncLead } = useGoogleSheets()

  const [messages, setMessages] = React.useState<ChatMessage[]>(initialMessages)
  const [botState, setBotState] = React.useState<ChatbotState>(createInitialChatbotState)
  const [draft, setDraft] = React.useState("")
  const [demoNumber] = React.useState(generateDemoWhatsAppNumber)
  const [result, setResult] = React.useState<{ lead: Lead; eligible: boolean; score: number; bandLabel: string } | null>(null)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages.length])

  function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || result) return

    const userMsg: ChatMessage = { id: nextMsgId("u"), sender: "user", text: trimmed }
    const { reply, state: newState, finished } = nextChatbotTurn(botState, trimmed)
    const botMsg: ChatMessage = { id: nextMsgId("b"), sender: "bot", text: reply }

    setMessages((prev) => [...prev, userMsg, botMsg])
    setBotState(newState)
    setDraft("")

    if (finished) {
      const fullTranscript = [...messages, userMsg].map((m) => m.text).join(" ")
      const classification = classifyChatbotLead(newState, fullTranscript, config.minimumLeadScore)
      const now = nowIso()
      const lead: Lead = {
        id: generateLeadId(),
        name: newState.collected.name || "WhatsApp Contact",
        whatsappNumber: demoNumber,
        company: newState.collected.businessType,
        stage: classification.eligibleForCallQueue ? "qualified" : "qualifying",
        status: classification.status,
        score: classification.score,
        source: { platform: "direct" },
        qualification: {
          businessType: newState.collected.businessType,
          location: newState.collected.location,
          serviceInterested: newState.collected.serviceInterested,
          requirement: newState.collected.requirement,
          budget: newState.collected.budget,
          timeline: newState.collected.timeline,
        },
        callPermission: classification.callPermission,
        createdAt: now,
        updatedAt: now,
        lastInteractionAt: now,
        notes: "Captured from the WhatsApp AI chatbot demo.",
        tags: ["whatsapp-chatbot-demo"],
      }
      addLead(lead)
      if (classification.eligibleForCallQueue) {
        addToQueue(lead.id)
      }
      syncLead(lead).then(() => markSheetSynced(lead.id))
      setResult({ lead, eligible: classification.eligibleForCallQueue, score: classification.score, bandLabel: classification.bandLabel })
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    send(draft)
  }

  function reset() {
    setMessages(initialMessages())
    setBotState(createInitialChatbotState())
    setDraft("")
    setResult(null)
  }

  return (
    <Card className="gap-4 px-5 py-5">
      <CardHeader className="flex-row items-center justify-between px-0">
        <div className="flex flex-col gap-1">
          <CardTitle className="flex items-center gap-1.5 text-[15px]">
            <Bot className="size-4" />
            WhatsApp AI chatbot — live demo
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Type as if you&apos;re the customer. The bot qualifies naturally — it only reaches the AI Call Queue if the conversation earns it.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={reset}>
          <RotateCcw />
          Restart
        </Button>
      </CardHeader>

      <CardContent className="grid grid-cols-1 gap-5 px-0 lg:grid-cols-[1fr_18rem]">
        <div className="flex h-[26rem] flex-col rounded-xl bg-muted/30 ring-1 ring-border">
          <div className="flex items-center gap-2 border-b border-border px-3.5 py-2.5">
            <WhatsAppIcon size={16} />
            <span className="text-xs text-muted-foreground">
              Chatting as <span className="font-medium text-foreground">{demoNumber}</span> (simulated)
            </span>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3.5 py-3">
            <div className="flex flex-col gap-2.5">
              {messages.map((message) => (
                <div key={message.id} className={cn("flex", message.sender === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-snug",
                      message.sender === "user" ? "rounded-br-sm bg-brand text-brand-foreground" : "rounded-bl-sm bg-card text-foreground ring-1 ring-border"
                    )}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {!result ? (
            <div className="flex flex-col gap-2 border-t border-border p-3">
              {messages.length === 1 && (
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_REPLIES.map((qr) => (
                    <button
                      key={qr}
                      type="button"
                      onClick={() => send(qr)}
                      className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-ring/50 hover:text-foreground"
                    >
                      {qr}
                    </button>
                  ))}
                </div>
              )}
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Type a message…" className="h-9 flex-1" />
                <Button type="submit" size="icon" disabled={!draft.trim()} aria-label="Send message">
                  <Send />
                </Button>
              </form>
            </div>
          ) : (
            <div className={cn("flex items-center gap-2 border-t border-border p-3 text-xs", result.eligible ? "text-success" : "text-muted-foreground")}>
              {result.eligible ? <CircleCheck className="size-4 shrink-0" /> : <CircleAlert className="size-4 shrink-0" />}
              {result.eligible
                ? "Qualified — this lead was added to the AI Call Queue for manual approval."
                : "Not qualified yet — saved to Leads for follow-up, not sent to the Call Queue."}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 rounded-xl bg-muted/40 p-3.5">
            <span className="text-xs font-semibold text-muted-foreground">Collected so far</span>
            <InfoRow label="Name" value={botState.collected.name} />
            <InfoRow label="Service" value={botState.collected.serviceInterested} />
            <InfoRow label="Business" value={botState.collected.businessType} />
            <InfoRow label="Location" value={botState.collected.location} />
            <InfoRow label="Budget" value={botState.collected.budget} />
            <InfoRow label="Timeline" value={botState.collected.timeline} />
            <InfoRow label="Wants a call" value={botState.collected.wantsCall === undefined ? undefined : botState.collected.wantsCall ? "Yes" : "No"} />
          </div>

          {result && (
            <div className="flex flex-col gap-2 rounded-xl bg-muted/40 p-3.5">
              <span className="text-xs font-semibold text-muted-foreground">Qualification result</span>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Score</span>
                <LeadScoreBadge score={result.score} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Call queue</span>
                <span className={cn("flex items-center gap-1 text-xs font-medium", result.eligible ? "text-success" : "text-muted-foreground")}>
                  <PhoneCall className="size-3" />
                  {result.eligible ? "Queued" : "Not sent"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Google Sheet</span>
                <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <FileSpreadsheet className="size-3" />
                  Synced (simulated)
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("truncate font-medium", value ? "text-foreground" : "text-muted-foreground/50")}>{value ?? "—"}</span>
    </div>
  )
}
