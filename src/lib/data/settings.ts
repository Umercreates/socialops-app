import type { Integration, TeamMember } from "@/types"

export const TEAM_MEMBERS: TeamMember[] = [
  { id: "team_1", name: "Maya Reyes", email: "maya@easyland.co", role: "admin", status: "active" },
  { id: "team_2", name: "Priya Anand", email: "priya@easyland.co", role: "content-creator", status: "active" },
  { id: "team_3", name: "Jordan Blake", email: "jordan@easyland.co", role: "manager", status: "active" },
  { id: "team_4", name: "Sam Whitfield", email: "sam@easyland.co", role: "support-agent", status: "invited" },
]

export const INTEGRATIONS: Integration[] = [
  { id: "int_zapier", name: "Zapier", description: "Trigger workflows in 6,000+ apps from Easyland events.", status: "not-connected", category: "automation" },
  { id: "int_make", name: "Make", description: "Build visual automations across your stack.", status: "coming-soon", category: "automation" },
  { id: "int_n8n", name: "n8n", description: "Self-hosted workflow automation.", status: "coming-soon", category: "automation" },
  { id: "int_webhooks", name: "Webhooks", description: "Send raw event payloads to any endpoint.", status: "not-connected", category: "automation" },
  { id: "int_hubspot", name: "HubSpot CRM", description: "Sync leads captured from DMs and comments.", status: "coming-soon", category: "crm" },
  { id: "int_whatsapp", name: "WhatsApp Business", description: "Bring WhatsApp conversations into the unified inbox.", status: "coming-soon", category: "messaging" },
  { id: "int_gcal", name: "Google Calendar", description: "Two-way sync scheduled posts with your calendar.", status: "not-connected", category: "productivity" },
  { id: "int_openai", name: "AI provider (OpenAI-compatible)", description: "Power the AI Assistant with a real model.", status: "not-connected", category: "ai" },
]
