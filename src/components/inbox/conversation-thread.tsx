"use client"

import * as React from "react"
import { ArrowLeft, Info, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlatformIcon, PLATFORM_LABEL } from "@/components/dashboard/platform-icon"
import { formatRelativeTime } from "@/lib/format"
import { MOCK_NOW } from "@/lib/data/constants"
import { useConversations } from "@/lib/store/conversations-store"
import type { ConversationWithMessages } from "@/lib/data/conversations"
import { cn } from "@/lib/utils"

function initialsFor(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

interface ConversationThreadProps {
  conversation: ConversationWithMessages
  onBack?: () => void
  onShowInfo?: () => void
}

export function ConversationThread({ conversation, onBack, onShowInfo }: ConversationThreadProps) {
  const { sendReply } = useConversations()
  const [draft, setDraft] = React.useState("")
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [conversation.messages.length, conversation.id])

  function handleSend(event: React.FormEvent) {
    event.preventDefault()
    if (!draft.trim()) return
    sendReply(conversation.id, draft.trim())
    setDraft("")
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 border-b border-border px-3 py-2.5">
        {onBack && (
          <Button variant="ghost" size="icon-sm" onClick={onBack} aria-label="Back to conversations" className="lg:hidden">
            <ArrowLeft />
          </Button>
        )}
        <span className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
          {initialsFor(conversation.contactName)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium text-foreground">{conversation.contactName}</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <PlatformIcon platform={conversation.platform} size={11} />
            {PLATFORM_LABEL[conversation.platform]} · {conversation.contactHandle}
          </span>
        </div>
        {onShowInfo && (
          <Button variant="ghost" size="icon-sm" onClick={onShowInfo} aria-label="Contact details" className="xl:hidden">
            <Info />
          </Button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4">
        <div className="flex flex-col gap-3">
          {conversation.messages.map((message) => (
            <div key={message.id} className={cn("flex", message.direction === "outbound" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-snug",
                  message.direction === "outbound"
                    ? "rounded-br-sm bg-brand text-brand-foreground"
                    : "rounded-bl-sm bg-muted text-foreground"
                )}
              >
                {message.body}
                <div
                  className={cn(
                    "mt-1 text-[10px]",
                    message.direction === "outbound" ? "text-brand-foreground/70" : "text-muted-foreground"
                  )}
                >
                  {formatRelativeTime(message.sentAt, MOCK_NOW)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-border p-3">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Write a reply…"
          className="h-9 flex-1"
        />
        <Button type="submit" size="icon" disabled={!draft.trim()} aria-label="Send reply">
          <Send />
        </Button>
      </form>
    </div>
  )
}
