import type { Notification } from "@/types"

export const NOTIFICATIONS: Notification[] = [
  {
    id: "notif_1",
    type: "message",
    title: "New DM from @trailrunco",
    description: "\"Would love to talk about a collab for fall...\"",
    createdAt: "2026-08-09T15:03:00Z",
    read: false,
  },
  {
    id: "notif_2",
    type: "comment",
    title: "New comment on Instagram",
    description: "@wildandwoven commented on your lookbook post.",
    createdAt: "2026-08-09T11:20:00Z",
    read: false,
  },
  {
    id: "notif_3",
    type: "publish-failed",
    title: "Publish failed on X",
    description: "\"Product drop teaser\" needs account reauthorization.",
    createdAt: "2026-08-08T22:14:00Z",
    read: false,
  },
  {
    id: "notif_4",
    type: "publish-success",
    title: "TikTok video published",
    description: "\"Studio tour: 60 seconds\" is now live.",
    createdAt: "2026-08-09T08:30:00Z",
    read: true,
  },
  {
    id: "notif_5",
    type: "account-warning",
    title: "X connection needs attention",
    description: "Reconnect @easylife to keep publishing on schedule.",
    createdAt: "2026-08-08T09:12:00Z",
    read: true,
  },
  {
    id: "notif_6",
    type: "automation",
    title: "Automation completed",
    description: "\"Auto-reply: pricing questions\" handled 6 comments.",
    createdAt: "2026-08-09T10:05:00Z",
    read: true,
  },
]
