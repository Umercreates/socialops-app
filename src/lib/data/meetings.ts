import type { Meeting } from "@/types"
import { LEADS } from "./leads"

const ahmed = LEADS.find((l) => l.name === "Ahmed Khan")!
const usman = LEADS.find((l) => l.name === "Usman Developers")!
const nova = LEADS.find((l) => l.name === "Nova Properties")!

export const MEETINGS: Meeting[] = [
  {
    id: "meet_1",
    leadId: ahmed.id,
    date: "2026-08-10",
    time: "3:00 PM",
    timezone: "Asia/Karachi",
    customerName: ahmed.name,
    phone: ahmed.whatsappNumber,
    email: ahmed.email,
    service: "EasyLife AI Automation Consultation",
    assignedTo: "team_4",
    meetingLink: "demo://meeting/ahmed-khan-consultation",
    status: "scheduled",
    notes: "Technical demo consultation — 8 sales agents, 700–1,000 leads/month.",
    createdAt: "2026-08-09T15:03:20Z",
  },
  {
    id: "meet_2",
    leadId: usman.id,
    date: "2026-08-11",
    time: "11:00 AM",
    timezone: "Asia/Karachi",
    customerName: usman.name,
    phone: usman.whatsappNumber,
    email: usman.email,
    service: "Enterprise Sales Automation Demo",
    assignedTo: "team_4",
    meetingLink: "demo://meeting/usman-developers-enterprise-demo",
    status: "scheduled",
    notes: "Enterprise volume — 1,000+ property leads/month.",
    createdAt: "2026-08-08T16:03:40Z",
  },
  {
    id: "meet_3",
    leadId: nova.id,
    date: "2026-07-20",
    time: "2:00 PM",
    timezone: "Asia/Karachi",
    customerName: nova.name,
    phone: nova.whatsappNumber,
    email: nova.email,
    service: "Implementation Kickoff",
    assignedTo: "team_4",
    meetingLink: "demo://meeting/nova-properties-kickoff",
    status: "completed",
    notes: "Kickoff call — signed full sales automation implementation.",
    createdAt: "2026-07-15T10:00:00Z",
  },
]
