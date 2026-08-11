import type { Meeting } from "@/types"
import { LEADS } from "./leads"

const priya = LEADS.find((l) => l.name === "Priya Malhotra")!
const layla = LEADS.find((l) => l.name === "Layla Haddad")!
const wildAndWoven = LEADS.find((l) => l.name === "Wild & Woven")!

export const MEETINGS: Meeting[] = [
  {
    id: "meet_1",
    leadId: priya.id,
    date: "2026-08-13",
    time: "10:00 AM",
    timezone: "America/Los_Angeles",
    customerName: priya.name,
    phone: priya.whatsappNumber,
    email: priya.email,
    service: "Studio session package",
    assignedTo: "team_1",
    meetingLink: "https://meet.google.com/demo-priya-session",
    status: "scheduled",
    notes: "Confirm morning slot, send contract beforehand.",
    createdAt: "2026-08-09T13:14:00Z",
  },
  {
    id: "meet_2",
    leadId: layla.id,
    date: "2026-08-12",
    time: "9:00 AM",
    timezone: "Asia/Dubai",
    customerName: layla.name,
    phone: layla.whatsappNumber,
    email: layla.email,
    service: "Full brand refresh + social management",
    assignedTo: "team_1",
    meetingLink: "https://meet.google.com/demo-layla-refresh",
    status: "confirmed",
    notes: "Creative director joining this call.",
    createdAt: "2026-08-08T13:24:00Z",
  },
  {
    id: "meet_3",
    leadId: wildAndWoven.id,
    date: "2026-07-20",
    time: "2:00 PM",
    timezone: "America/Los_Angeles",
    customerName: wildAndWoven.name,
    phone: wildAndWoven.whatsappNumber,
    email: wildAndWoven.email,
    service: "Full brand refresh (delivered)",
    assignedTo: "team_1",
    meetingLink: "https://meet.google.com/demo-wildwoven-kickoff",
    status: "completed",
    notes: "Kickoff call — signed quarterly retainer.",
    createdAt: "2026-07-15T10:00:00Z",
  },
]
