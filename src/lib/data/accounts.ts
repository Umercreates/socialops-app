import type { SocialAccount } from "@/types"

/**
 * Seed connected-account data. `/dashboard/accounts` reads this through the
 * `accounts-store` so connect/disconnect/reconnect actions mutate live state
 * without touching this module.
 */
export const SOCIAL_ACCOUNTS: SocialAccount[] = [
  {
    id: "acct_instagram",
    platform: "instagram",
    displayName: "EasyLife",
    handle: "@easylife",
    followers: 124800,
    followersDelta30d: 3120,
    health: "connected",
    connectedAt: "2025-11-02T09:00:00Z",
    lastSyncAt: "2026-08-09T15:40:00Z",
  },
  {
    id: "acct_facebook",
    platform: "facebook",
    displayName: "EasyLife",
    handle: "EasyLife",
    followers: 89400,
    followersDelta30d: 610,
    health: "connected",
    connectedAt: "2025-11-02T09:04:00Z",
    lastSyncAt: "2026-08-09T15:40:00Z",
  },
  {
    id: "acct_linkedin",
    platform: "linkedin",
    displayName: "EasyLife",
    handle: "EasyLife",
    followers: 31600,
    followersDelta30d: 940,
    health: "connected",
    connectedAt: "2025-12-14T13:20:00Z",
    lastSyncAt: "2026-08-09T15:35:00Z",
  },
  {
    id: "acct_tiktok",
    platform: "tiktok",
    displayName: "EasyLife",
    handle: "@easylife",
    followers: 210500,
    followersDelta30d: 8340,
    health: "connected",
    connectedAt: "2026-01-08T11:00:00Z",
    lastSyncAt: "2026-08-09T15:38:00Z",
  },
  {
    id: "acct_youtube",
    platform: "youtube",
    displayName: "EasyLife",
    handle: "EasyLife",
    followers: 47900,
    followersDelta30d: 420,
    health: "attention",
    connectedAt: "2025-11-20T10:00:00Z",
    lastSyncAt: "2026-08-08T04:12:00Z",
  },
  {
    id: "acct_x",
    platform: "x",
    displayName: "EasyLife",
    handle: "@easylife",
    followers: 26750,
    followersDelta30d: -180,
    health: "expired",
    connectedAt: "2025-11-02T09:10:00Z",
    lastSyncAt: "2026-08-06T18:22:00Z",
  },
]
