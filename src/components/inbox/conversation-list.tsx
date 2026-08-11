"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { PlatformIcon } from "@/components/dashboard/platform-icon"
import { formatRelativeTime } from "@/lib/format"
import { MOCK_NOW } from "@/lib/data/constants"
import type { ConversationWithMessages } from "@/lib/data/conversations"
import { cn } from "@/lib/utils"

export type InboxFilter = "all" | "unread" | "attention" | "instagram" | "facebook" | "linkedin" | "tiktok" | "x"

const FILTERS: { value: InboxFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "attention", label: "Needs attention" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "tiktok", label: "TikTok" },
  { value: "x", label: "X" },
]

function initialsFor(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

interface ConversationListProps {
  conversations: ConversationWithMessages[]
  selectedId: string | null
  onSelect: (id: string) => void
  filter: InboxFilter
  onFilterChange: (filter: InboxFilter) => void
  query: string
  onQueryChange: (query: string) => void
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  filter,
  onFilterChange,
  query,
  onQueryChange,
}: ConversationListProps) {
  const filtered = conversations.filter((conv) => {
    if (filter === "unread" && !conv.unread) return false
    if (filter === "attention" && !conv.needsAttention) return false
    if (["instagram", "facebook", "linkedin", "tiktok", "x"].includes(filter) && conv.platform !== filter) return false
    if (query.trim()) {
      const q = query.toLowerCase()
      if (!conv.contactName.toLowerCase().includes(q) && !conv.contactHandle.toLowerCase().includes(q)) return false
    }
    return true
  })

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-2.5 border-b border-border p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search conversations…"
            className="h-8 pl-8"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => onFilterChange(f.value)}
              className={cn(
                "shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                filter === f.value
                  ? "border-brand bg-brand/5 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">No conversations match.</p>
        ) : (
          filtered.map((conv) => (
            <button
              key={conv.id}
              type="button"
              onClick={() => onSelect(conv.id)}
              className={cn(
                "flex w-full items-start gap-2.5 border-b border-border px-3 py-3 text-left hover:bg-muted/50",
                selectedId === conv.id && "bg-muted/70"
              )}
            >
              <div className="relative shrink-0">
                <span className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  {initialsFor(conv.contactName)}
                </span>
                <span className="absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-full bg-card ring-1 ring-border">
                  <PlatformIcon platform={conv.platform} accent size={9} />
                </span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn("truncate text-sm", conv.unread ? "font-semibold text-foreground" : "font-medium text-foreground")}>
                    {conv.contactName}
                  </span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{formatRelativeTime(conv.lastMessageAt, MOCK_NOW)}</span>
                </div>
                <span className="truncate text-xs text-muted-foreground">{conv.lastMessage}</span>
              </div>
              {conv.unread && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" aria-hidden="true" />}
            </button>
          ))
        )}
      </div>
    </div>
  )
}
