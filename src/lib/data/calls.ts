import type { Call, CallQueueItem } from "@/types"
import { LEADS } from "./leads"

const trailRun = LEADS.find((l) => l.name === "Trail Run Co.")!
const priya = LEADS.find((l) => l.name === "Priya Malhotra")!
const ferris = LEADS.find((l) => l.name === "Ferris Okafor")!
const layla = LEADS.find((l) => l.name === "Layla Haddad")!
const noah = LEADS.find((l) => l.name === "Noah Bennett")!

export const CALL_QUEUE: CallQueueItem[] = [
  {
    id: "queue_1",
    leadId: trailRun.id,
    status: "ready",
    preferredTime: "Weekday afternoons",
    attempts: 0,
    maxAttempts: 3,
    createdAt: "2026-08-09T15:10:00Z",
  },
  {
    id: "queue_2",
    leadId: ferris.id,
    status: "ready",
    preferredTime: "Evenings (GMT)",
    attempts: 0,
    maxAttempts: 3,
    createdAt: "2026-08-08T16:05:00Z",
  },
  {
    id: "queue_3",
    leadId: priya.id,
    status: "meeting-booked",
    attempts: 1,
    maxAttempts: 3,
    createdAt: "2026-08-09T13:00:00Z",
  },
  {
    id: "queue_4",
    leadId: layla.id,
    status: "meeting-booked",
    attempts: 1,
    maxAttempts: 3,
    createdAt: "2026-08-08T13:05:00Z",
  },
  {
    id: "queue_5",
    leadId: noah.id,
    status: "not-interested",
    attempts: 1,
    maxAttempts: 3,
    createdAt: "2026-08-02T10:30:00Z",
  },
]

export const CALLS: Call[] = [
  {
    id: "call_1",
    leadId: priya.id,
    status: "meeting-booked",
    startedAt: "2026-08-09T13:05:00Z",
    endedAt: "2026-08-09T13:14:00Z",
    durationSeconds: 540,
    transcript: [
      { id: "t1", speaker: "agent", text: "Hi Priya, this is Aria from EasyLife — thanks for your interest, got a couple minutes?", timestamp: "2026-08-09T13:05:10Z" },
      { id: "t2", speaker: "lead", text: "Yes, go ahead!", timestamp: "2026-08-09T13:05:20Z" },
      { id: "t3", speaker: "agent", text: "Great — I saw you're looking for a half-day brand photoshoot. What's driving that right now?", timestamp: "2026-08-09T13:05:35Z" },
      { id: "t4", speaker: "lead", text: "My website and LinkedIn both use photos from three years ago, it's overdue.", timestamp: "2026-08-09T13:06:00Z" },
      { id: "t5", speaker: "agent", text: "Makes sense. Our half-day session runs around $1,200 and includes full editing. Would next week work?", timestamp: "2026-08-09T13:07:00Z" },
      { id: "t6", speaker: "lead", text: "That works, mornings are best for me.", timestamp: "2026-08-09T13:07:30Z" },
    ],
    summary: {
      requirements: "Half-day brand photoshoot for website + LinkedIn refresh.",
      painPoints: "Current photos are three years old.",
      budget: "$1,200",
      timeline: "Next week",
      interestedService: "Studio session package",
      objections: "None.",
      buyingIntent: "high",
      recommendedNextAction: "Confirm morning slot and send contract.",
      updatedScore: 88,
      meetingStatus: "booked",
      followUpRequired: false,
    },
  },
  {
    id: "call_2",
    leadId: layla.id,
    status: "meeting-booked",
    startedAt: "2026-08-08T13:10:00Z",
    endedAt: "2026-08-08T13:24:00Z",
    durationSeconds: 840,
    transcript: [
      { id: "t1", speaker: "agent", text: "Hi Layla, this is Aria calling from EasyLife — thanks for reaching out about a brand refresh.", timestamp: "2026-08-08T13:10:10Z" },
      { id: "t2", speaker: "lead", text: "Yes! We really need a new look, our current branding doesn't match our work anymore.", timestamp: "2026-08-08T13:10:40Z" },
      { id: "t3", speaker: "agent", text: "Understood — and what's the timeline you're hoping for?", timestamp: "2026-08-08T13:11:10Z" },
      { id: "t4", speaker: "lead", text: "As soon as possible, ideally we'd start this month.", timestamp: "2026-08-08T13:11:30Z" },
      { id: "t5", speaker: "agent", text: "Our full brand refresh + management package runs about $5,000/month. Should I set up a call with our creative director?", timestamp: "2026-08-08T13:12:30Z" },
      { id: "t6", speaker: "lead", text: "Yes, please — mornings work best for me, Dubai time.", timestamp: "2026-08-08T13:13:00Z" },
    ],
    summary: {
      requirements: "Full brand refresh and social management.",
      painPoints: "Branding doesn't reflect the quality of their work.",
      budget: "$5,000/month",
      timeline: "ASAP — this month",
      interestedService: "Full brand refresh + social management",
      objections: "None raised.",
      buyingIntent: "high",
      recommendedNextAction: "Loop in creative director, confirm morning GST meeting.",
      updatedScore: 91,
      meetingStatus: "booked",
      followUpRequired: false,
    },
  },
  {
    id: "call_3",
    leadId: noah.id,
    status: "not-interested",
    startedAt: "2026-08-02T10:35:00Z",
    endedAt: "2026-08-02T10:39:00Z",
    durationSeconds: 240,
    transcript: [
      { id: "t1", speaker: "agent", text: "Hi Noah, this is Aria from EasyLife, thanks for your interest — got a minute?", timestamp: "2026-08-02T10:35:10Z" },
      { id: "t2", speaker: "lead", text: "Sure, but I should say upfront our budget is pretty limited.", timestamp: "2026-08-02T10:35:30Z" },
      { id: "t3", speaker: "agent", text: "No problem — what range are you working with?", timestamp: "2026-08-02T10:36:00Z" },
      { id: "t4", speaker: "lead", text: "Probably under $300 a month, honestly.", timestamp: "2026-08-02T10:36:20Z" },
      { id: "t5", speaker: "agent", text: "Understood — that's below our minimum engagement, but I can point you to some DIY resources if helpful.", timestamp: "2026-08-02T10:37:00Z" },
      { id: "t6", speaker: "lead", text: "Appreciate it, maybe down the line.", timestamp: "2026-08-02T10:37:30Z" },
    ],
    summary: {
      requirements: "Basic social presence for a hardware store.",
      painPoints: "N/A",
      budget: "Under $300/month",
      timeline: "N/A",
      interestedService: "Basic social presence",
      objections: "Budget below minimum engagement.",
      buyingIntent: "low",
      recommendedNextAction: "Add to long-term nurture list, revisit in 6 months.",
      updatedScore: 24,
      meetingStatus: "declined",
      followUpRequired: true,
    },
  },
]
