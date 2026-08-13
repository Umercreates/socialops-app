"use client"

import * as React from "react"
import { Bot, Send, Loader2, Sparkles, Info, Cpu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AI_CAPABILITIES } from "@/components/ai/ai-capabilities"
import type { AiCapability, AiChatMessage } from "@/types"
import { cn } from "@/lib/utils"

/** Calls the server route, which tries real Gemini first and only falls
 * back to the local template if Gemini is unavailable — the route always
 * resolves, it never throws, so the UI never has to render an error state. */
async function getAiResponse(capability: AiCapability, input: string): Promise<{ text: string; source: "gemini" | "simulated" }> {
  try {
    const res = await fetch("/api/ai/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ capability, input }),
    })
    const body = await res.json()
    return { text: body.text as string, source: (body.source as "gemini" | "simulated") ?? "simulated" }
  } catch {
    return { text: "Sorry, something went wrong reaching the AI Assistant — please try again.", source: "simulated" }
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
  const [messages, setMessages] = React.useState<AiChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I can help draft captions, suggest hashtags, brainstorm content ideas, or draft replies. Pick a shortcut on the left or just type below.",
      createdAt: new Date().toISOString(),
    },
  ])
  const [input, setInput] = React.useState("")
  const [activeCapability, setActiveCapability] = React.useState<AiCapability>("caption")
  const [isThinking, setIsThinking] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, isThinking])

  async function handleSend(event: React.FormEvent) {
    event.preventDefault()
    const text = input.trim()
    if (!text || isThinking) return

    const userMessage: AiChatMessage = { id: `u_${Date.now()}`, role: "user", content: text, createdAt: new Date().toISOString() }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsThinking(true)

    const { text: reply, source } = await getAiResponse(activeCapability, text)
    setMessages((prev) => [...prev, { id: `a_${Date.now()}`, role: "assistant", content: reply, createdAt: new Date().toISOString(), source }])
    setIsThinking(false)
  }

  function applyShortcut(capability: AiCapability, prompt: string) {
    setActiveCapability(capability)
    setInput(prompt)
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[15rem_1fr]">
      <div className="flex flex-col gap-1.5">
        <span className="px-1 text-xs font-medium text-muted-foreground">Quick actions</span>
        {AI_CAPABILITIES.map((cap) => (
          <button
            key={cap.value}
            type="button"
            onClick={() => applyShortcut(cap.value, cap.prompt)}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
              activeCapability === cap.value ? "bg-brand/5 text-foreground ring-1 ring-brand/30" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <cap.icon className="size-4 shrink-0" strokeWidth={1.75} />
            {cap.label}
          </button>
        ))}
      </div>

      <div className="flex h-[36rem] flex-col overflow-hidden rounded-xl bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-foreground/10">
        <div className="flex items-center gap-2 border-b border-border px-3.5 py-2.5 text-xs text-muted-foreground">
          <Info className="size-3.5 shrink-0" />
          Powered by Gemini when available — falls back to a local demo response if the AI provider is unreachable.
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
          <div className="flex flex-col gap-4">
            {messages.map((message) => (
              <div key={message.id} className={cn("flex gap-2.5", message.role === "user" && "flex-row-reverse")}>
                {message.role === "assistant" && initialsAvatar()}
                <div className={cn("flex max-w-[80%] flex-col gap-1", message.role === "user" && "items-end")}>
                  <div
                    className={cn(
                      "rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap",
                      message.role === "user" ? "rounded-br-sm bg-brand text-brand-foreground" : "rounded-bl-sm bg-muted text-foreground"
                    )}
                  >
                    {message.content}
                  </div>
                  {message.role === "assistant" && message.source && (
                    <span className="flex items-center gap-1 px-1 text-[10px] text-muted-foreground/70">
                      <Cpu className="size-2.5" />
                      {message.source === "gemini" ? "Gemini" : "Simulated (demo fallback)"}
                    </span>
                  )}
                </div>
              </div>
            ))}
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

        <form onSubmit={handleSend} className="flex items-end gap-2 border-t border-border p-3">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault()
                handleSend(event)
              }
            }}
            placeholder={`Ask for a ${AI_CAPABILITIES.find((c) => c.value === activeCapability)?.label.toLowerCase()}…`}
            className="min-h-10 flex-1 resize-none"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isThinking} aria-label="Send">
            {isThinking ? <Loader2 className="animate-spin" /> : <Send />}
          </Button>
        </form>
      </div>
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
