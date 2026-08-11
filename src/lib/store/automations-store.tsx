"use client"

import * as React from "react"
import type { Automation, AutomationStatus } from "@/types"
import { AUTOMATIONS } from "@/lib/data/automations"
import { createListStore } from "./create-list-store"

const { Provider, useRawStore } = createListStore<Automation>(AUTOMATIONS)
export const AutomationsProvider = Provider

let idCounter = 0
export function generateAutomationId() {
  idCounter += 1
  return `auto_new_${Date.now()}_${idCounter}`
}

export function useAutomations() {
  const { items, setItems } = useRawStore()

  const addAutomation = React.useCallback(
    (automation: Automation) => {
      setItems((prev) => [automation, ...prev])
    },
    [setItems]
  )

  const setStatus = React.useCallback(
    (id: string, status: AutomationStatus) => {
      setItems((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
    },
    [setItems]
  )

  const removeAutomation = React.useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((a) => a.id !== id))
    },
    [setItems]
  )

  const duplicateAutomation = React.useCallback(
    (id: string) => {
      setItems((prev) => {
        const original = prev.find((a) => a.id === id)
        if (!original) return prev
        const copy: Automation = { ...original, id: generateAutomationId(), name: `${original.name} (copy)`, status: "draft", runsLast30d: 0, lastRunAt: null }
        return [copy, ...prev]
      })
    },
    [setItems]
  )

  const recordTestRun = React.useCallback(
    (id: string) => {
      setItems((prev) =>
        prev.map((a) => (a.id === id ? { ...a, runsLast30d: a.runsLast30d + 1, lastRunAt: new Date().toISOString() } : a))
      )
    },
    [setItems]
  )

  return { automations: items, addAutomation, setStatus, removeAutomation, duplicateAutomation, recordTestRun }
}
