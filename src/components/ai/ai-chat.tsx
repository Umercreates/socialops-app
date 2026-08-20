"use client"

import * as React from "react"
import { Bot, Send, Loader2, Sparkles, Info, RotateCcw, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useDashboardViewMode } from "@/lib/dashboard-view-mode-context"
import type { AiChatMessage } from "@/types"
import { cn } from "@/lib/utils"

const SUGGESTIONS = [
  "Write a hiring post",
  "Create interview questions",
  "Draft an employee message",
  "Explain EasyLife",
  "Write a sales follow-up",
  "Create social media content",
  "Summarize a lead",
  "Help me prepare a proposal",
]

const WELCOME_ID = "welcome"
const UNAVAILABLE_TEXT = "EasyLife AI is temporarily unavailable. Please try again shortly."

let msgIdCounter = 0
function nextMsgId(prefix: string) {
  msgIdCounter += 1
  return `${prefix}_${msgIdCounter}`
}

function welcomeMessage(): AiChatMessage {
  return {
    id: WELCOME_ID,
    role: "assistant",
    content: "Hi! I'm the EasyLife AI Assistant — ask me anything about EasyLife, get HR/business help, or just chat. What can I help with?",
    createdAt: new Date().toISOString(),
  }
}

/** Calls the real multi-turn chat route - genuine Gemini in both Client
 * and Demo Mode (the one deliberate exception to "Demo Mode makes zero
 * real provider calls"; see /api/ai/chat's own doc comment). Sends the
 * conversation so far (server bounds it further) so a follow-up like
 * "make it shorter" actually has context, not just the latest message.
 * Never throws - a network failure resolves to the same honest
 * "unavailable" result the server itself returns for a Gemini failure. */
async function requestAiReply(history: { role: "user" | "assistant"; content: string }[]): Promise<{ ok: true; text: string } | { ok: false }> {
  try {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ messages: history }),
    })
    const body = await res.json().catch(() => null)
    if (res.ok && body?.ok && typeof body.text === "string") {
      return { ok: true, text: body.text }
    }
    return { ok: false }
  } catch {
    return { ok: false }
  }
}

function initialsAvatar() {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand">
      <Bot className="size-4" />
    </span>
  )
}

export function AiChat() {
  const { mode } = useDashboardViewMode()
  const [messages, setMessages] = React.useState<AiChatMessage[]>(() => [welcomeMessage()])
  const [input, setInput] = React.useState("")
  const [isThinking, setIsThinking] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, isThinking])

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || isThinking) return

    const userMessage: AiChatMessage = { id: nextMsgId("u"), role: "user", content: trimmed, createdAt: new Date().toISOString() }
    const historySoFar = messages.filter((m) => m.id !== WELCOME_ID && m.source !== "error").map((m) => ({ role: m.role, content: m.content }))

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsThinking(true)

    const result = await requestAiReply([...historySoFar, { role: "user", content: trimmed }])
    setMessages((prev) => [
      ...prev,
      result.ok
        ? { id: nextMsgId("a"), role: "assistant", content: result.text, createdAt: new Date().toISOString(), source: "gemini" }
        : { id: nextMsgId("a"), role: "assistant", content: UNAVAILABLE_TEXT, createdAt: new Date().toISOString(), source: "error" },
    ])
    setIsThinking(false)
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    void sendMessage(input)
  }

  function retryLastMessage() {
    const lastUser = [...messages].reverse().find((m) => m.role === "user")
    if (!lastUser || isThinking) return
    // Drop the trailing error bubble before resending, so a retry doesn't
    // pile up duplicate "unavailable" messages.
    setMessages((prev) => (prev[prev.length - 1]?.source === "error" ? prev.slice(0, -1) : prev))
    void sendMessage(lastUser.content)
  }

  const isEmptyState = messages.length === 1 && messages[0].id === WELCOME_ID

  return (
    <div className="mx-auto flex h-[36rem] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-foreground/10">
      <div className="flex items-center gap-2 border-b border-border px-3.5 py-2.5 text-xs text-muted-foreground">
        <Info className="size-3.5 shrink-0" />
        EasyLife AI · Powered by Gemini
        {mode === "demo" && <span className="text-muted-foreground/70">— demo workspace, no real CRM data is shared</span>}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-4">
          {messages.map((message) => {
            const isError = message.source === "error"
            return (
              <div key={message.id} className={cn("flex gap-2.5", message.role === "user" && "flex-row-reverse")}>
                {message.role === "assistant" && initialsAvatar()}
                <div className={cn("flex max-w-[80%] flex-col gap-1", message.role === "user" && "items-end")}>
                  <div
                    className={cn(
                      "rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap",
                      message.role === "user"
                        ? "rounded-br-sm bg-brand text-brand-foreground"
                        : isError
                          ? "rounded-bl-sm bg-warning/10 text-warning-foreground dark:text-warning"
                          : "rounded-bl-sm bg-muted text-foreground"
                    )}
                  >
                    {isError && <TriangleAlert className="mb-1 size-3.5" />}
                    {message.content}
                  </div>
                  {isError && (
                    <button
                      type="button"
                      onClick={retryLastMessage}
                      disabled={isThinking}
                      className="flex items-center gap-1 px-1 text-[11px] font-medium text-brand hover:underline disabled:opacity-50"
                    >
                      <RotateCcw className="size-3" />
                      Retry
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {isEmptyState && !isThinking && (
            <div className="flex flex-wrap gap-1.5 pl-9.5">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void sendMessage(suggestion)}
                  className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-ring/50 hover:text-foreground"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {isThinking && (
            <div className="flex gap-2.5">
              {initialsAvatar()}
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2.5">
                <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Thinking…</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-border p-3">
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              handleSubmit(event)
            }
          }}
          placeholder="Ask anything — EasyLife, HR, hiring, sales, content, or general questions…"
          className="min-h-10 flex-1 resize-none"
          disabled={isThinking}
        />
        <Button type="submit" size="icon" disabled={!input.trim() || isThinking} aria-label="Send">
          {isThinking ? <Loader2 className="animate-spin" /> : <Send />}
        </Button>
      </form>
    </div>
  )
}

export function AiPageHeader() {
  return (
    <div className="flex items-center gap-2">
      <Sparkles className="size-5 text-brand" />
      <h2 className="text-xl font-semibold tracking-tight text-foreground">AI Assistant</h2>
    </div>
  )
}
