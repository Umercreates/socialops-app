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
 * `/dashboard` can read/mutate shared mock state without prop drilling.
 * `crmMode` swaps only the Leads store between the demo in-memory version
 * and the real database-backed one — every other store here stays demo. */
export function MockDataProvider({ children, crmMode = "demo" }: { children: ReactNode; crmMode?: "demo" | "database" }) {
  return (
    <AccountsProvider>
      <PostsProvider>
        <ConversationsProvider>
          <CommentsProvider>
            <AutomationsProvider>
              <KnowledgeProvider>
                <SettingsProvider>
                  <WhatsAppProvider>
                    <LeadsProvider crmMode={crmMode}>
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
