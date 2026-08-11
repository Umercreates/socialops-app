"use client"

import * as React from "react"
import type { CallAgentConfig } from "@/types"
import { CALL_AGENT_CONFIG } from "@/lib/data/call-agent"

interface CallAgentContextValue {
  config: CallAgentConfig
  setConfig: React.Dispatch<React.SetStateAction<CallAgentConfig>>
}

const CallAgentContext = React.createContext<CallAgentContextValue | null>(null)

export function CallAgentProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = React.useState<CallAgentConfig>(CALL_AGENT_CONFIG)
  const value = React.useMemo(() => ({ config, setConfig }), [config])
  return <CallAgentContext.Provider value={value}>{children}</CallAgentContext.Provider>
}

export function useCallAgentConfig() {
  const ctx = React.useContext(CallAgentContext)
  if (!ctx) throw new Error("useCallAgentConfig must be used within CallAgentProvider")
  const { config, setConfig } = ctx

  const update = React.useCallback(
    (patch: Partial<CallAgentConfig>) => setConfig((prev) => ({ ...prev, ...patch })),
    [setConfig]
  )

  return { config, update }
}
