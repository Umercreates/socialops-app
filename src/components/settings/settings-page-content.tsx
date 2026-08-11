"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GeneralSettings } from "@/components/settings/general-settings"
import { TeamSettings } from "@/components/settings/team-settings"
import { NotificationSettings } from "@/components/settings/notification-settings"
import { IntegrationSettings } from "@/components/settings/integration-settings"
import { WhatsAppSettings } from "@/components/settings/whatsapp-settings"
import { CallAgentSettings } from "@/components/settings/call-agent-settings"
import { SheetsSettings } from "@/components/settings/sheets-settings"
import { UsageSettings } from "@/components/settings/usage-settings"

export function SettingsPageContent() {
  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your workspace, team, notifications, and integrations.</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="max-w-full overflow-x-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="call-agent">Call Agent</TabsTrigger>
          <TabsTrigger value="sheets">Google Sheets</TabsTrigger>
          <TabsTrigger value="usage">Usage & Costs</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="pt-4">
          <GeneralSettings />
        </TabsContent>
        <TabsContent value="team" className="pt-4">
          <TeamSettings />
        </TabsContent>
        <TabsContent value="notifications" className="pt-4">
          <NotificationSettings />
        </TabsContent>
        <TabsContent value="integrations" className="pt-4">
          <IntegrationSettings />
        </TabsContent>
        <TabsContent value="whatsapp" className="pt-4">
          <WhatsAppSettings />
        </TabsContent>
        <TabsContent value="call-agent" className="pt-4">
          <CallAgentSettings />
        </TabsContent>
        <TabsContent value="sheets" className="pt-4">
          <SheetsSettings />
        </TabsContent>
        <TabsContent value="usage" className="pt-4">
          <UsageSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
