"use client"

import * as React from "react"
import type { Meeting, MeetingStatus } from "@/types"
import { MEETINGS } from "@/lib/data/meetings"
import { createListStore } from "./create-list-store"

const { Provider, useRawStore } = createListStore<Meeting>(MEETINGS)
export const MeetingsProvider = Provider

let idCounter = 0
export function generateMeetingId() {
  idCounter += 1
  return `meet_new_${Date.now()}_${idCounter}`
}

export function useMeetings() {
  const { items: meetings, setItems: setMeetings } = useRawStore()

  const addMeeting = React.useCallback(
    (meeting: Meeting) => {
      setMeetings((prev) => [meeting, ...prev])
    },
    [setMeetings]
  )

  const setStatus = React.useCallback(
    (id: string, status: MeetingStatus) => {
      setMeetings((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)))
    },
    [setMeetings]
  )

  const meetingsForLead = React.useCallback((leadId: string) => meetings.filter((m) => m.leadId === leadId), [meetings])

  return { meetings, addMeeting, setStatus, meetingsForLead }
}
