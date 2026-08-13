"use client"

import * as React from "react"
import { Loader2, Bot, UserCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { LeadScoreBadge } from "@/components/leads/lead-score-badge"
import type { Lead } from "@/types"

interface ConversationSummary {
  id: string
  contactPhone: string
  contactName: string | null
  status: "bot" | "escalated" | "human" | "closed"
  lastMessageAt: string
  lead: Lead | null
}

interface MessageView {
  id: string
  direction: "inbound" | "outbound"
  sender: "customer" | "bot" | "agent"
  messageType: string
  body: string | null
  providerStatus: string
  createdAt: string
}

const STATUS_LABEL: Record<ConversationSummary["status"], string> = {
  bot: "AI qualifying",
  escalated: "Needs human",
  human: "Human handling",
  closed: "Closed",
}

const STATUS_TONE: Record<ConversationSummary["status"], "info" | "warning" | "success" | "neutral"> = {
  bot: "info",
  escalated: "warning",
  human: "success",
  closed: "neutral",
}

export function LiveConversationsList() {
  const [conversations, setConversations] = React.useState<ConversationSummary[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [messages, setMessages] = React.useState<MessageView[] | null>(null)

  React.useEffect(() => {
    fetch("/api/whatsapp/conversations", { credentials: "same-origin" })
      .then((res) => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then((data) => setConversations(data.conversations))
      .catch(() => setError("Couldn't load conversations."))
  }, [])

  const [syncedSelectedId, setSyncedSelectedId] = React.useState(selectedId)
  if (selectedId !== syncedSelectedId) {
    setSyncedSelectedId(selectedId)
    setMessages(null)
  }

  React.useEffect(() => {
    if (!selectedId) return
    fetch(`/api/whatsapp/conversations/${selectedId}/messages`, { credentials: "same-origin" })
      .then((res) => res.json())
      .then((data) => setMessages(data.messages))
      .catch(() => setMessages([]))
  }, [selectedId])

  const selected = conversations?.find((c) => c.id === selectedId) ?? null

  if (error) {
    return (
      <Card className="px-5 py-8 text-center text-sm text-muted-foreground">{error}</Card>
    )
  }

  if (!conversations) {
    return (
      <Card className="flex items-center justify-center px-5 py-10">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      <Card className="gap-3 px-4 py-4 lg:col-span-2">
        <CardHeader className="px-0">
          <CardTitle className="text-[15px]">Live conversations</CardTitle>
          <p className="text-xs text-muted-foreground">Real inbound WhatsApp Cloud API messages, not the demo simulator.</p>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-border px-0">
          {conversations.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No live conversations yet.</p>
          )}
          {conversations.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedId(c.id)}
              className="flex flex-col gap-1.5 py-3 text-left transition-colors hover:bg-muted/40"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-foreground">{c.contactName ?? c.contactPhone}</span>
                <StatusBadge tone={STATUS_TONE[c.status]}>
                  {c.status === "bot" ? <Bot className="size-3" /> : <UserCheck className="size-3" />}
                  {STATUS_LABEL[c.status]}
                </StatusBadge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{c.contactPhone}</span>
                {c.lead && <LeadScoreBadge score={c.lead.score} className="ml-auto" />}
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="gap-3 px-4 py-4 lg:col-span-3">
        {!selected ? (
          <div className="flex flex-1 items-center justify-center py-10 text-sm text-muted-foreground">
            Select a conversation to view the thread.
          </div>
        ) : (
          <>
            <CardHeader className="px-0">
              <CardTitle className="text-[15px]">{selected.contactName ?? selected.contactPhone}</CardTitle>
              {selected.lead && (
                <p className="text-xs text-muted-foreground">
                  Stage: {selected.lead.stage} · Score: {selected.lead.score}
                </p>
              )}
            </CardHeader>
            <CardContent className="flex flex-col gap-2 px-0">
              {!messages ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No messages yet.</p>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={`flex ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                        m.direction === "outbound" ? "bg-brand text-brand-foreground" : "bg-muted text-foreground"
                      }`}
                    >
                      {m.body ?? `[${m.messageType}]`}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}
