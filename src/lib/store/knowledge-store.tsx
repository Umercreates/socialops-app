"use client"

import * as React from "react"
import type { KnowledgeSource } from "@/types"
import { KNOWLEDGE_SOURCES } from "@/lib/data/knowledge"
import { createListStore } from "./create-list-store"

const { Provider, useRawStore } = createListStore<KnowledgeSource>(KNOWLEDGE_SOURCES)
export const KnowledgeProvider = Provider

let idCounter = 0
export function generateKnowledgeId() {
  idCounter += 1
  return `kb_new_${Date.now()}_${idCounter}`
}

export function useKnowledgeSources() {
  const { items, setItems } = useRawStore()

  const addSource = React.useCallback(
    (source: KnowledgeSource) => {
      setItems((prev) => [source, ...prev])
      // Simulate processing → ready after a short delay, like a real ingestion pipeline would.
      setTimeout(() => {
        setItems((prev) => prev.map((s) => (s.id === source.id ? { ...s, status: "ready" } : s)))
      }, 2200)
    },
    [setItems]
  )

  const removeSource = React.useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((s) => s.id !== id))
    },
    [setItems]
  )

  return { sources: items, addSource, removeSource }
}
