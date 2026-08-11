"use client"

import * as React from "react"
import { StickyNote, Tag as TagIcon, UserCheck, CircleCheck, X as XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlatformIcon, PLATFORM_LABEL } from "@/components/dashboard/platform-icon"
import { WhatsAppIcon } from "@/components/whatsapp/whatsapp-icon"
import { useConversations } from "@/lib/store/conversations-store"
import { useWhatsAppAccount, useWhatsAppCta } from "@/lib/store/whatsapp-store"
import { buildClickToChatLink, fillMessageTemplate } from "@/lib/integrations/whatsapp"
import { classifyLeadIntent } from "@/lib/integrations/ai/lead-intent"
import { LEAD_STATUS_LABEL, LEAD_STATUS_TONE } from "@/lib/lead-status"
import { formatRelativeTime } from "@/lib/format"
import { MOCK_NOW } from "@/lib/data/constants"
import type { ConversationWithMessages } from "@/lib/data/conversations"
import type { LeadStatus } from "@/types"
import { cn } from "@/lib/utils"

function initialsFor(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

const LEAD_LABEL: Record<LeadStatus, string> = { none: "No status", lead: "Lead", customer: "Customer" }

export function ContactPanel({ conversation }: { conversation: ConversationWithMessages }) {
  const { updateNotes, addTag, removeTag, setLeadStatus, toggleResolved, sendReply, sendWhatsAppCta } = useConversations()
  const { account } = useWhatsAppAccount()
  const { ctaMessage } = useWhatsAppCta()
  const [notesDraft, setNotesDraft] = React.useState(conversation.notes)
  const [tagDraft, setTagDraft] = React.useState("")

  const intent = classifyLeadIntent(conversation.lastMessage)

  function handleSendWhatsAppCta() {
    const message = fillMessageTemplate(ctaMessage, {
      name: conversation.contactName,
      platform: PLATFORM_LABEL[conversation.platform],
      campaign: "",
      post: "",
      service: "",
      source: "dm",
    })
    const link = buildClickToChatLink(account.number, message)
    sendReply(conversation.id, `Thanks for your interest. Please continue with our team on WhatsApp for complete details.\n\nContinue on WhatsApp: ${link}`)
    sendWhatsAppCta(conversation.id)
  }

  // Reload the notes draft synchronously when the selected conversation
  // changes, so switching threads never shows the previous one's draft.
  const [prevConversationId, setPrevConversationId] = React.useState(conversation.id)
  if (conversation.id !== prevConversationId) {
    setPrevConversationId(conversation.id)
    setNotesDraft(conversation.notes)
  }

  function handleAddTag(event: React.FormEvent) {
    event.preventDefault()
    if (!tagDraft.trim()) return
    addTag(conversation.id, tagDraft.trim())
    setTagDraft("")
  }

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto p-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-muted text-base font-medium text-muted-foreground">
          {initialsFor(conversation.contactName)}
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">{conversation.contactName}</span>
          <span className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <PlatformIcon platform={conversation.platform} size={11} />
            {PLATFORM_LABEL[conversation.platform]} · {conversation.contactHandle}
          </span>
        </div>
      </div>

      <Button
        variant={conversation.resolved ? "secondary" : "outline"}
        size="sm"
        className="w-full"
        onClick={() => toggleResolved(conversation.id)}
      >
        <CircleCheck className={cn(conversation.resolved && "text-success")} />
        {conversation.resolved ? "Marked resolved" : "Mark resolved"}
      </Button>

      <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">Detected intent</span>
          <StatusBadge tone={LEAD_STATUS_TONE[intent]}>{LEAD_STATUS_LABEL[intent]}</StatusBadge>
        </div>
        {conversation.whatsappCtaSentAt ? (
          <p className="text-xs text-muted-foreground">
            <WhatsAppIcon size={11} className="mr-1 inline-block align-[-1px]" />
            WhatsApp link sent {formatRelativeTime(conversation.whatsappCtaSentAt, MOCK_NOW)} · waiting for the contact to open it.
          </p>
        ) : (
          <>
            <div className="rounded-lg bg-muted/50 px-2.5 py-2 text-[11px] text-muted-foreground">
              “Thanks for your interest. Please continue with our team on WhatsApp for complete details.”
              <br />
              <span className="font-medium text-brand">[Continue on WhatsApp]</span>
            </div>
            <Button size="sm" variant="outline" className="w-full" onClick={handleSendWhatsAppCta}>
              <WhatsAppIcon size={13} />
              Send WhatsApp Link
            </Button>
            <p className="text-[11px] leading-snug text-muted-foreground">
              We don&apos;t have a WhatsApp number for this contact yet — this sends a wa.me link in the DM. A lead is only created once they open it.
            </p>
          </>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <UserCheck className="size-3.5" />
          Lead status
        </Label>
        <Select value={conversation.leadStatus} onValueChange={(value) => setLeadStatus(conversation.id, value as LeadStatus)}>
          <SelectTrigger className="h-8 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(LEAD_LABEL) as LeadStatus[]).map((status) => (
              <SelectItem key={status} value={status}>
                {LEAD_LABEL[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <TagIcon className="size-3.5" />
          Tags
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {conversation.tags.length === 0 && <span className="text-xs text-muted-foreground/70">No tags yet</span>}
          {conversation.tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-foreground"
            >
              {tag}
              <button type="button" onClick={() => removeTag(conversation.id, tag)} aria-label={`Remove tag ${tag}`}>
                <XIcon className="size-2.5 text-muted-foreground hover:text-foreground" />
              </button>
            </span>
          ))}
        </div>
        <form onSubmit={handleAddTag} className="flex gap-1.5">
          <Input
            value={tagDraft}
            onChange={(event) => setTagDraft(event.target.value)}
            placeholder="Add a tag…"
            className="h-8 flex-1"
          />
          <Button type="submit" size="sm" variant="outline" disabled={!tagDraft.trim()}>
            Add
          </Button>
        </form>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contact-notes" className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <StickyNote className="size-3.5" />
          Notes
        </Label>
        <Textarea
          id="contact-notes"
          value={notesDraft}
          onChange={(event) => setNotesDraft(event.target.value)}
          onBlur={() => updateNotes(conversation.id, notesDraft)}
          placeholder="Add internal notes about this contact…"
          className="min-h-24 resize-none text-sm"
        />
      </div>
    </div>
  )
}
