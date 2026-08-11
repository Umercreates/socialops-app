"use client"

import * as React from "react"
import type { Integration, IntegrationStatus, TeamMember, TeamRole } from "@/types"
import { TEAM_MEMBERS, INTEGRATIONS } from "@/lib/data/settings"
import { createListStore } from "./create-list-store"

const teamStore = createListStore<TeamMember>(TEAM_MEMBERS)
const integrationsStore = createListStore<Integration>(INTEGRATIONS)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  return (
    <teamStore.Provider>
      <integrationsStore.Provider>{children}</integrationsStore.Provider>
    </teamStore.Provider>
  )
}

let idCounter = 0
function nextTeamId() {
  idCounter += 1
  return `team_new_${Date.now()}_${idCounter}`
}

export function useTeamMembers() {
  const { items, setItems } = teamStore.useRawStore()

  const inviteMember = React.useCallback(
    (name: string, email: string, role: TeamRole) => {
      const member: TeamMember = { id: nextTeamId(), name, email, role, status: "invited" }
      setItems((prev) => [...prev, member])
    },
    [setItems]
  )

  const removeMember = React.useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((m) => m.id !== id))
    },
    [setItems]
  )

  const setRole = React.useCallback(
    (id: string, role: TeamRole) => {
      setItems((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)))
    },
    [setItems]
  )

  return { members: items, inviteMember, removeMember, setRole }
}

export function useIntegrations() {
  const { items, setItems } = integrationsStore.useRawStore()

  const setStatus = React.useCallback(
    (id: string, status: IntegrationStatus) => {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)))
    },
    [setItems]
  )

  return { integrations: items, setStatus }
}
