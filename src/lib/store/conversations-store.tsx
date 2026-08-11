"use client"

import * as React from "react"
import type { LeadStatus, Message } from "@/types"
import { CONVERSATIONS, type ConversationWithMessages } from "@/lib/data/conversations"
import { createListStore } from "./create-list-store"

const { Provider, useRawStore } = createListStore<ConversationWithMessages>(CONVERSATIONS)
export const ConversationsProvider = Provider

let idCounter = 0
function nextMessageId(conversationId: string) {
  idCounter += 1
  return `${conversationId}_msg_new_${idCounter}`
}

export function useConversations() {
  const { items, setItems } = useRawStore()

  const sendReply = React.useCallback(
    (conversationId: string, body: string) => {
      const message: Message = {
        id: nextMessageId(conversationId),
        conversationId,
        body,
        sentAt: new Date().toISOString(),
        direction: "outbound",
      }
      setItems((prev) =>
        prev.map((conv) =>
          conv.id === conversationId
            ? { ...conv, messages: [...conv.messages, message], lastMessage: body, lastMessageAt: message.sentAt, unread: false }
            : conv
        )
      )
    },
    [setItems]
  )

  const markRead = React.useCallback(
    (conversationId: string) => {
      setItems((prev) => prev.map((conv) => (conv.id === conversationId ? { ...conv, unread: false } : conv)))
    },
    [setItems]
  )

  const updateNotes = React.useCallback(
    (conversationId: string, notes: string) => {
      setItems((prev) => prev.map((conv) => (conv.id === conversationId ? { ...conv, notes } : conv)))
    },
    [setItems]
  )

  const addTag = React.useCallback(
    (conversationId: string, tag: string) => {
      setItems((prev) =>
        prev.map((conv) =>
          conv.id === conversationId && !conv.tags.includes(tag) ? { ...conv, tags: [...conv.tags, tag] } : conv
        )
      )
    },
    [setItems]
  )

  const removeTag = React.useCallback(
    (conversationId: string, tag: string) => {
      setItems((prev) =>
        prev.map((conv) => (conv.id === conversationId ? { ...conv, tags: conv.tags.filter((t) => t !== tag) } : conv))
      )
    },
    [setItems]
  )

  const setLeadStatus = React.useCallback(
    (conversationId: string, leadStatus: LeadStatus) => {
      setItems((prev) => prev.map((conv) => (conv.id === conversationId ? { ...conv, leadStatus } : conv)))
    },
    [setItems]
  )

  const toggleResolved = React.useCallback(
    (conversationId: string) => {
      setItems((prev) =>
        prev.map((conv) => (conv.id === conversationId ? { ...conv, resolved: !conv.resolved } : conv))
      )
    },
    [setItems]
  )

  const sendWhatsAppCta = React.useCallback(
    (conversationId: string) => {
      setItems((prev) =>
        prev.map((conv) => (conv.id === conversationId ? { ...conv, whatsappCtaSentAt: new Date().toISOString() } : conv))
      )
    },
    [setItems]
  )

  /** Finds an existing DM thread for this contact, or opens a new one — used
   * when a comment author is DM'd for the first time (comment → DM handoff). */
  const startOrFindConversation = React.useCallback(
    (params: { platform: ConversationWithMessages["platform"]; contactName: string; contactHandle: string; openingMessage: string }) => {
      const existing = items.find((c) => c.platform === params.platform && c.contactHandle === params.contactHandle)
      const conversationId = existing?.id ?? `conv_new_${Date.now()}`
      const message: Message = {
        id: nextMessageId(conversationId),
        conversationId,
        body: params.openingMessage,
        sentAt: new Date().toISOString(),
        direction: "outbound",
      }

      if (existing) {
        setItems((prev) =>
          prev.map((c) =>
            c.id === existing.id ? { ...c, messages: [...c.messages, message], lastMessage: params.openingMessage, lastMessageAt: message.sentAt } : c
          )
        )
      } else {
        const created: ConversationWithMessages = {
          id: conversationId,
          platform: params.platform,
          contactName: params.contactName,
          contactHandle: params.contactHandle,
          lastMessage: params.openingMessage,
          lastMessageAt: message.sentAt,
          unread: false,
          needsAttention: false,
          resolved: false,
          notes: "",
          tags: [],
          leadStatus: "none",
          messages: [message],
        }
        setItems((prev) => [created, ...prev])
      }

      return conversationId
    },
    [items, setItems]
  )

  return {
    conversations: items,
    sendReply,
    markRead,
    updateNotes,
    addTag,
    removeTag,
    setLeadStatus,
    toggleResolved,
    sendWhatsAppCta,
    startOrFindConversation,
  }
}
