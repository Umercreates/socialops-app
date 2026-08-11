"use client"

import type { ReactNode } from "react"
import { AccountsProvider } from "./accounts-store"
import { PostsProvider } from "./posts-store"
import { ConversationsProvider } from "./conversations-store"
import { CommentsProvider } from "./comments-store"
import { AutomationsProvider } from "./automations-store"
import { KnowledgeProvider } from "./knowledge-store"
import { SettingsProvider } from "./settings-store"
import { WhatsAppProvider } from "./whatsapp-store"
import { LeadsProvider } from "./leads-store"
import { CallsProvider } from "./calls-store"
import { MeetingsProvider } from "./meetings-store"
import { CallAgentProvider } from "./call-agent-store"
import { SheetsProvider } from "./sheets-store"

/** Single mount point for every in-memory demo store, so any page under
 * `/dashboard` can read/mutate shared mock state without prop drilling. */
export function MockDataProvider({ children }: { children: ReactNode }) {
  return (
    <AccountsProvider>
      <PostsProvider>
        <ConversationsProvider>
          <CommentsProvider>
            <AutomationsProvider>
              <KnowledgeProvider>
                <SettingsProvider>
                  <WhatsAppProvider>
                    <LeadsProvider>
                      <CallsProvider>
                        <MeetingsProvider>
                          <CallAgentProvider>
                            <SheetsProvider>{children}</SheetsProvider>
                          </CallAgentProvider>
                        </MeetingsProvider>
                      </CallsProvider>
                    </LeadsProvider>
                  </WhatsAppProvider>
                </SettingsProvider>
              </KnowledgeProvider>
            </AutomationsProvider>
          </CommentsProvider>
        </ConversationsProvider>
      </PostsProvider>
    </AccountsProvider>
  )
}
