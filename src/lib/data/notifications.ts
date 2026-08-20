import type { Notification } from "@/types"

export const NOTIFICATIONS: Notification[] = [
  {
    id: "notif_1",
    type: "automation",
    title: "New qualified lead",
    description: "Ahmed Khan scored 87 — automatically marked Qualified.",
    createdAt: "2026-08-09T15:03:00Z",
    read: false,
  },
  {
    id: "notif_2",
    type: "message",
    title: "Meeting booked",
    description: "AI Automation Consultation scheduled for tomorrow with Ahmed Khan.",
    createdAt: "2026-08-09T13:14:00Z",
    read: false,
  },
  {
    id: "notif_3",
    type: "comment",
    title: "Instagram comment",
    description: "New purchase-intent comment received on your latest post.",
    createdAt: "2026-08-09T11:20:00Z",
    read: false,
  },
  {
    id: "notif_4",
    type: "call-completed",
    title: "AI Call Completed",
    description: "Lead sentiment is positive — high-intent prospect.",
    createdAt: "2026-08-09T13:14:00Z",
    read: true,
  },
  {
    id: "notif_5",
    type: "publish-success",
    title: "Scheduled Post Published",
    description: "Instagram Reel published successfully.",
    createdAt: "2026-08-09T08:30:00Z",
    read: true,
  },
]
