"use client"

import * as React from "react"
import type { Call, CallQueueItem, CallStatus, CallTranscriptLine } from "@/types"
import { CALL_QUEUE, CALLS } from "@/lib/data/calls"
import { createListStore } from "./create-list-store"

const queueStore = createListStore<CallQueueItem>(CALL_QUEUE)
const callsStore = createListStore<Call>(CALLS)

export function CallsProvider({ children }: { children: React.ReactNode }) {
  return (
    <queueStore.Provider>
      <callsStore.Provider>{children}</callsStore.Provider>
    </queueStore.Provider>
  )
}

let idCounter = 0
export function generateCallId() {
  idCounter += 1
  return `call_new_${Date.now()}_${idCounter}`
}

export function useCallQueue() {
  const { items: queue, setItems: setQueue } = queueStore.useRawStore()

  const setStatus = React.useCallback(
    (id: string, status: CallStatus) => {
      setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, status } : q)))
    },
    [setQueue]
  )

  const incrementAttempts = React.useCallback(
    (id: string) => {
      setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, attempts: q.attempts + 1 } : q)))
    },
    [setQueue]
  )

  const schedule = React.useCallback(
    (id: string, scheduledFor: string) => {
      setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, status: "scheduled", scheduledFor } : q)))
    },
    [setQueue]
  )

  const addToQueue = React.useCallback(
    (leadId: string, preferredTime?: string) => {
      setQueue((prev) => [
        ...prev,
        { id: `queue_new_${Date.now()}`, leadId, status: "ready", preferredTime, attempts: 0, maxAttempts: 3, createdAt: new Date().toISOString() },
      ])
    },
    [setQueue]
  )

  const removeFromQueue = React.useCallback(
    (id: string) => {
      setQueue((prev) => prev.filter((q) => q.id !== id))
    },
    [setQueue]
  )

  return { queue, setStatus, incrementAttempts, schedule, addToQueue, removeFromQueue }
}

export function useCalls() {
  const { items: calls, setItems: setCalls } = callsStore.useRawStore()

  const startCall = React.useCallback(
    (leadId: string) => {
      const call: Call = {
        id: generateCallId(),
        leadId,
        status: "calling",
        startedAt: new Date().toISOString(),
        transcript: [],
      }
      setCalls((prev) => [call, ...prev])
      return call.id
    },
    [setCalls]
  )

  const appendTranscriptLine = React.useCallback(
    (callId: string, line: CallTranscriptLine) => {
      setCalls((prev) => prev.map((c) => (c.id === callId ? { ...c, transcript: [...c.transcript, line] } : c)))
    },
    [setCalls]
  )

  const endCall = React.useCallback(
    (callId: string, status: CallStatus, summary?: Call["summary"]) => {
      setCalls((prev) =>
        prev.map((c) =>
          c.id === callId
            ? {
                ...c,
                status,
                endedAt: new Date().toISOString(),
                durationSeconds: c.startedAt ? Math.round((Date.now() - new Date(c.startedAt).getTime()) / 1000) : undefined,
                summary,
              }
            : c
        )
      )
    },
    [setCalls]
  )

  const callsForLead = React.useCallback((leadId: string) => calls.filter((c) => c.leadId === leadId), [calls])

  return { calls, startCall, appendTranscriptLine, endCall, callsForLead }
}
