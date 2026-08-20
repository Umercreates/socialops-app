import type { Notification } from "@/types"

export const NOTIFICATIONS: Notification[] = [
  {
    id: "notif_1",
    type: "automation",
    title: "New Qualified Lead",
    description: "Ahmed Khan reached a lead score of 87.",
    createdAt: "2026-08-09T15:03:00Z",
    read: false,
  },
  {
    id: "notif_2",
    type: "message",
    title: "Meeting Booked",
    description: "Usman Developers booked an enterprise automation demo.",
    createdAt: "2026-08-08T16:03:00Z",
    read: false,
  },
  {
    id: "notif_3",
    type: "call-completed",
    title: "AI Call Completed",
    description: "Ahmed Khan's call completed with positive sentiment.",
    createdAt: "2026-08-09T15:04:00Z",
    read: false,
  },
  {
    id: "notif_4",
    type: "automation",
    title: "Deal Won",
    description: "Nova Properties moved to Closed Won.",
    createdAt: "2026-08-09T09:35:00Z",
    read: true,
  },
  {
    id: "notif_5",
    type: "comment",
    title: "Instagram Lead",
    description: "Sara Malik asked about WhatsApp + CRM automation.",
    createdAt: "2026-08-09T11:10:00Z",
    read: true,
  },
  {
    id: "notif_6",
    type: "publish-success",
    title: "Scheduled Post Published",
    description: "\"How AI Follows Up With Leads Automatically\" was published in Demo Mode.",
    createdAt: "2026-08-09T08:30:00Z",
    read: true,
  },
]
