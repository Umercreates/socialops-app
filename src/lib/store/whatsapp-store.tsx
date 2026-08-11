"use client"

import * as React from "react"
import type { SendToWhatsAppMode, WhatsAppAccount } from "@/types"
import { WHATSAPP_ACCOUNT, DEFAULT_CTA_MESSAGE } from "@/lib/data/whatsapp"
import { simulateConnectWhatsAppAccount } from "@/lib/integrations/whatsapp"

export interface WhatsAppAiSettings {
  aiReplyEnabled: boolean
  qualificationEnabled: boolean
  humanApprovalRequired: boolean
  businessHoursStart: string
  businessHoursEnd: string
  escalationEnabled: boolean
}

const DEFAULT_AI_SETTINGS: WhatsAppAiSettings = {
  aiReplyEnabled: true,
  qualificationEnabled: true,
  humanApprovalRequired: true,
  businessHoursStart: "10:00",
  businessHoursEnd: "19:00",
  escalationEnabled: true,
}

interface WhatsAppAccountContextValue {
  account: WhatsAppAccount
  setAccount: React.Dispatch<React.SetStateAction<WhatsAppAccount>>
  ctaMessage: string
  setCtaMessage: React.Dispatch<React.SetStateAction<string>>
  sendMode: SendToWhatsAppMode
  setSendMode: React.Dispatch<React.SetStateAction<SendToWhatsAppMode>>
  aiSettings: WhatsAppAiSettings
  setAiSettings: React.Dispatch<React.SetStateAction<WhatsAppAiSettings>>
}

const WhatsAppAccountContext = React.createContext<WhatsAppAccountContextValue | null>(null)

/** Easyland runs a single WhatsApp Business account/number — this provider
 * is a plain context (no list store needed) since there's only ever one
 * record to hold. */
export function WhatsAppProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = React.useState<WhatsAppAccount>(WHATSAPP_ACCOUNT)
  const [ctaMessage, setCtaMessage] = React.useState(DEFAULT_CTA_MESSAGE)
  const [sendMode, setSendMode] = React.useState<SendToWhatsAppMode>("interested-only")
  const [aiSettings, setAiSettings] = React.useState<WhatsAppAiSettings>(DEFAULT_AI_SETTINGS)

  const value = React.useMemo(
    () => ({ account, setAccount, ctaMessage, setCtaMessage, sendMode, setSendMode, aiSettings, setAiSettings }),
    [account, ctaMessage, sendMode, aiSettings]
  )

  return <WhatsAppAccountContext.Provider value={value}>{children}</WhatsAppAccountContext.Provider>
}

function useWhatsAppAccountContext() {
  const ctx = React.useContext(WhatsAppAccountContext)
  if (!ctx) throw new Error("useWhatsAppAccount hooks must be used within WhatsAppProvider")
  return ctx
}

export function useWhatsAppAccount() {
  const { account, setAccount } = useWhatsAppAccountContext()

  const disconnect = React.useCallback(() => {
    setAccount((prev) => ({ ...prev, status: "disconnected", connectedAt: null }))
  }, [setAccount])

  const connect = React.useCallback(
    async (businessName: string, number: string) => {
      const result = await simulateConnectWhatsAppAccount(businessName)
      if (result.ok) {
        setAccount((prev) => ({
          ...prev,
          businessName,
          number,
          status: "connected",
          connectedAt: new Date().toISOString(),
          lastSyncAt: new Date().toISOString(),
        }))
      }
      return result
    },
    [setAccount]
  )

  const reconnect = React.useCallback(() => {
    setAccount((prev) => ({ ...prev, status: "connected", connectedAt: prev.connectedAt ?? new Date().toISOString(), lastSyncAt: new Date().toISOString() }))
  }, [setAccount])

  const setNumber = React.useCallback(
    (number: string) => setAccount((prev) => ({ ...prev, number })),
    [setAccount]
  )

  return { account, connect, disconnect, reconnect, setNumber }
}

export function useWhatsAppCta() {
  const { ctaMessage, setCtaMessage, sendMode, setSendMode } = useWhatsAppAccountContext()
  return { ctaMessage, setCtaMessage, sendMode, setSendMode }
}

export function useWhatsAppAiSettings() {
  const { aiSettings, setAiSettings } = useWhatsAppAccountContext()

  const update = React.useCallback(
    (patch: Partial<WhatsAppAiSettings>) => setAiSettings((prev) => ({ ...prev, ...patch })),
    [setAiSettings]
  )

  return { aiSettings, update }
}
