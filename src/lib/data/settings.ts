import type { Integration, TeamMember } from "@/types"

export const TEAM_MEMBERS: TeamMember[] = [
  { id: "team_1", name: "Ayesha Khan", email: "ayesha@easylife.pk", role: "owner", status: "active" },
  { id: "team_2", name: "Ali Raza", email: "ali@easylife.pk", role: "admin", status: "active" },
  { id: "team_3", name: "Mahnoor", email: "mahnoor@easylife.pk", role: "manager", status: "active" },
  { id: "team_4", name: "Ahmed", email: "ahmed@easylife.pk", role: "sales", status: "active" },
]

export const INTEGRATIONS: Integration[] = [
  { id: "int_zapier", name: "Zapier", description: "Trigger workflows in 6,000+ apps from EasyLife events.", status: "not-connected", category: "automation" },
  { id: "int_make", name: "Make", description: "Build visual automations across your stack.", status: "coming-soon", category: "automation" },
  { id: "int_n8n", name: "n8n", description: "Self-hosted workflow automation.", status: "coming-soon", category: "automation" },
  { id: "int_webhooks", name: "Webhooks", description: "Send raw event payloads to any endpoint.", status: "not-connected", category: "automation" },
  { id: "int_hubspot", name: "HubSpot CRM", description: "Sync leads captured from DMs and comments.", status: "coming-soon", category: "crm" },
  { id: "int_whatsapp", name: "WhatsApp Business", description: "Bring WhatsApp conversations into the unified inbox.", status: "coming-soon", category: "messaging" },
  { id: "int_gcal", name: "Google Calendar", description: "Two-way sync scheduled posts with your calendar.", status: "not-connected", category: "productivity" },
  { id: "int_openai", name: "AI provider (OpenAI-compatible)", description: "Power the AI Assistant with a real model.", status: "not-connected", category: "ai" },
]
