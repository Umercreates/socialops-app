import type { CallAgentConfig, UsageSummary } from "@/types"

export const CALL_AGENT_CONFIG: CallAgentConfig = {
  agentName: "Aria",
  companyName: "EasyLife",
  language: "Urdu + English (mixed)",
  voice: "Warm & professional (female)",
  greeting: "Assalam-o-Alaikum, main {{agentName}} bol rahi hoon {{companyName}} ki taraf se — thanks for your interest, do you have a couple of minutes to talk?",
  objective: "Qualify interest, confirm budget and timeline, and book a meeting with the sales team.",
  qualificationQuestions: [
    "What are you looking to get done?",
    "Do you have a rough budget or timeline in mind?",
    "Would you be open to a short call with our team this week?",
  ],
  minimumLeadScore: 51,
  mode: "manual",
  humanApproval: true,
  callingHoursStart: "10:00",
  callingHoursEnd: "19:00",
  timezone: "Asia/Karachi",
  maxAttempts: 3,
  assignedSalesPerson: "team_3",
}

export const USAGE_SUMMARY: UsageSummary = {
  metrics: [
    { label: "WhatsApp API messages", used: 1240, unit: "messages", estimatedCost: 0 },
    { label: "AI tokens (qualification + call notes)", used: 480000, unit: "tokens", estimatedCost: 9.6 },
    { label: "Call minutes (simulated)", used: 0, unit: "minutes", estimatedCost: 0 },
    { label: "Telephony (Twilio or similar)", used: 0, unit: "minutes", estimatedCost: 0 },
    { label: "Speech-to-text", used: 0, unit: "minutes", estimatedCost: 0 },
    { label: "Text-to-speech", used: 0, unit: "characters", estimatedCost: 0 },
    { label: "Automation executions", used: 312, unit: "runs", estimatedCost: 0 },
  ],
  estimatedMonthlyCost: 9.6,
  budgetThreshold: 100,
}
