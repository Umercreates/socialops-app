"use client"

import * as React from "react"
import { Inbox as InboxIcon } from "lucide-react"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { ConversationList, type InboxFilter } from "@/components/inbox/conversation-list"
import { ConversationThread } from "@/components/inbox/conversation-thread"
import { ContactPanel } from "@/components/inbox/contact-panel"
import { useConversations } from "@/lib/store/conversations-store"

export function InboxContent() {
  const { conversations, markRead } = useConversations()
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [filter, setFilter] = React.useState<InboxFilter>("all")
  const [query, setQuery] = React.useState("")
  const [infoOpen, setInfoOpen] = React.useState(false)

  const selected = conversations.find((c) => c.id === selectedId) ?? null

  function handleSelect(id: string) {
    setSelectedId(id)
    markRead(id)
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex h-[calc(100vh-var(--header-height))] min-h-0">
        <div className={`w-full shrink-0 border-r border-border lg:flex lg:w-80 ${selectedId ? "hidden" : "flex"}`}>
          <ConversationList
            conversations={conversations}
            selectedId={selectedId}
            onSelect={handleSelect}
            filter={filter}
            onFilterChange={setFilter}
            query={query}
            onQueryChange={setQuery}
          />
        </div>

        <div className={`min-w-0 flex-1 lg:flex ${selectedId ? "flex" : "hidden"}`}>
          {selected ? (
            <ConversationThread
              conversation={selected}
              onBack={() => setSelectedId(null)}
              onShowInfo={() => setInfoOpen(true)}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
              <InboxIcon className="size-6 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Select a conversation to get started.</p>
            </div>
          )}
        </div>

        {selected && (
          <div className="hidden w-72 shrink-0 border-l border-border xl:flex">
            <ContactPanel conversation={selected} />
          </div>
        )}
      </div>

      {selected && (
        <Sheet open={infoOpen} onOpenChange={setInfoOpen}>
          <SheetContent side="right" className="w-80 p-0">
            <SheetTitle className="sr-only">Contact details</SheetTitle>
            <ContactPanel conversation={selected} />
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}
