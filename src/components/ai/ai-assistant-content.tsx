"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AiChat, AiPageHeader } from "@/components/ai/ai-chat"
import { KnowledgeBase } from "@/components/ai/knowledge-base"

export function AiAssistantContent() {
  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
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
          <KnowledgeBase />
        </TabsContent>
      </Tabs>
    </div>
  )
}
