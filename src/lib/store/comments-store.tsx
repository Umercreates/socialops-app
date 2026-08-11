"use client"

import * as React from "react"
import type { CommentStatus } from "@/types"
import { COMMENTS } from "@/lib/data/comments"
import type { Comment } from "@/types"
import { createListStore } from "./create-list-store"

const { Provider, useRawStore } = createListStore<Comment>(COMMENTS)
export const CommentsProvider = Provider

export function useComments() {
  const { items, setItems } = useRawStore()

  const toggleLike = React.useCallback(
    (id: string) => {
      setItems((prev) => prev.map((c) => (c.id === id ? { ...c, likedByMe: !c.likedByMe } : c)))
    },
    [setItems]
  )

  const setStatus = React.useCallback(
    (id: string, status: CommentStatus) => {
      setItems((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)))
    },
    [setItems]
  )

  const removeComment = React.useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((c) => c.id !== id))
    },
    [setItems]
  )

  const markAsLead = React.useCallback(
    (id: string) => {
      setItems((prev) => prev.map((c) => (c.id === id ? { ...c, markedAsLead: true } : c)))
    },
    [setItems]
  )

  const markWhatsAppCtaSent = React.useCallback(
    (id: string) => {
      setItems((prev) => prev.map((c) => (c.id === id ? { ...c, whatsappCtaSentAt: new Date().toISOString() } : c)))
    },
    [setItems]
  )

  const markDmSent = React.useCallback(
    (id: string) => {
      setItems((prev) => prev.map((c) => (c.id === id ? { ...c, dmSentAt: new Date().toISOString() } : c)))
    },
    [setItems]
  )

  return { comments: items, toggleLike, setStatus, removeComment, markAsLead, markWhatsAppCtaSent, markDmSent }
}
