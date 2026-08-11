"use client"

import * as React from "react"
import type { ConnectionHealth, SocialAccount, SocialPlatform } from "@/types"
import { SOCIAL_ACCOUNTS } from "@/lib/data/accounts"
import { createListStore } from "./create-list-store"

const { Provider, useRawStore } = createListStore<SocialAccount>(SOCIAL_ACCOUNTS)
export const AccountsProvider = Provider

export function useSocialAccounts() {
  const { items, setItems } = useRawStore()

  const setHealth = React.useCallback(
    (id: string, health: ConnectionHealth) => {
      setItems((prev) => prev.map((a) => (a.id === id ? { ...a, health } : a)))
    },
    [setItems]
  )

  const disconnect = React.useCallback(
    (id: string) => {
      setItems((prev) => prev.map((a) => (a.id === id ? { ...a, health: "disconnected", connectedAt: null } : a)))
    },
    [setItems]
  )

  const reconnect = React.useCallback(
    (id: string) => {
      setItems((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, health: "connected", connectedAt: a.connectedAt ?? new Date().toISOString(), lastSyncAt: new Date().toISOString() }
            : a
        )
      )
    },
    [setItems]
  )

  const connectNew = React.useCallback(
    (platform: SocialPlatform, handle: string) => {
      const account: SocialAccount = {
        id: `acct_${platform}_${Date.now()}`,
        platform,
        displayName: handle.replace(/^@/, ""),
        handle: handle.startsWith("@") ? handle : `@${handle}`,
        followers: Math.round(1200 + Math.random() * 4000),
        followersDelta30d: Math.round(20 + Math.random() * 200),
        health: "connected",
        connectedAt: new Date().toISOString(),
        lastSyncAt: new Date().toISOString(),
      }
      setItems((prev) => [...prev, account])
      return account
    },
    [setItems]
  )

  return { accounts: items, setHealth, disconnect, reconnect, connectNew }
}
