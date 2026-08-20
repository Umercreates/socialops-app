"use client"

import { Info } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AiChat, AiPageHeader } from "@/components/ai/ai-chat"
import { KnowledgeBase } from "@/components/ai/knowledge-base"
import { useDashboardViewMode } from "@/lib/dashboard-view-mode-context"

export function AiAssistantContent() {
  const { mode } = useDashboardViewMode()

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 ease-out">
      <div className="flex flex-col gap-1">
        <AiPageHeader />
        <p className="text-sm text-muted-foreground">Draft, brainstorm, and reply faster — plus manage what the assistant knows about your brand.</p>
      </div>

      <Tabs defaultValue="chat">
        <TabsList>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge base</TabsTrigger>
        </TabsList>
        <TabsContent value="chat" className="pt-4">
          <AiChat />
        </TabsContent>
        <TabsContent value="knowledge" className="pt-4">
          {mode === "demo" ? (
            <KnowledgeBase />
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-16 text-center text-sm text-muted-foreground">
              <Info className="size-5 text-muted-foreground/50" />
              A real knowledge base (uploading docs/URLs the AI can reference) isn&apos;t built yet - the chat above already works
              with your real workspace data.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
