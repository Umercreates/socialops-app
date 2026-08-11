import type { AutomationActionType, AutomationConditionType, AutomationTriggerType } from "@/types"

export const TRIGGER_OPTIONS: { value: AutomationTriggerType; label: string; needsValue?: boolean }[] = [
  { value: "new-dm", label: "New social DM" },
  { value: "new-comment", label: "New comment received" },
  { value: "keyword", label: "Keyword mentioned", needsValue: true },
  { value: "scheduled", label: "Scheduled event" },
  { value: "lead-intent-detected", label: "Interested lead detected" },
  { value: "whatsapp-started", label: "WhatsApp conversation started" },
  { value: "whatsapp-lead-qualified", label: "WhatsApp lead qualified" },
  { value: "lead-score-above", label: "Lead score above threshold", needsValue: true },
  { value: "call-permission-received", label: "Call permission received" },
  { value: "call-completed", label: "AI call completed" },
  { value: "no-answer", label: "Call: no answer" },
  { value: "qualified-lead-ready", label: "Qualified lead ready for sales" },
  { value: "human-sales-assigned", label: "Human sales person assigned" },
  { value: "meeting-booked", label: "Meeting booked" },
  { value: "meeting-missed", label: "Meeting missed" },
]

export const CONDITION_OPTIONS: { value: AutomationConditionType; label: string; needsValue?: boolean }[] = [
  { value: "none", label: "No condition — always run" },
  { value: "contains-keyword", label: "Message contains keyword", needsValue: true },
  { value: "platform", label: "Platform is", needsValue: true },
  { value: "sentiment", label: "Sentiment is", needsValue: true },
  { value: "tag", label: "Contact has tag", needsValue: true },
]

export const ACTION_OPTIONS: { value: AutomationActionType; label: string; needsValue?: boolean }[] = [
  { value: "send-dm", label: "Send a DM" },
  { value: "reply", label: "Reply to comment" },
  { value: "like", label: "Like the comment" },
  { value: "add-tag", label: "Add a tag", needsValue: true },
  { value: "mark-lead", label: "Mark contact as lead" },
  { value: "assign-human", label: "Assign to a human agent" },
  { value: "send-booking-link", label: "Send booking link" },
  { value: "send-whatsapp-cta", label: "Send WhatsApp CTA" },
  { value: "assign-lead", label: "Assign lead", needsValue: true },
  { value: "change-lead-status", label: "Change lead status", needsValue: true },
  { value: "queue-ai-call", label: "Queue AI call" },
  { value: "schedule-ai-call", label: "Schedule AI call" },
  { value: "create-meeting", label: "Create meeting" },
  { value: "add-sheet-row", label: "Add Google Sheet row" },
  { value: "update-sheet-row", label: "Update Google Sheet row" },
  { value: "notify-team", label: "Notify human sales" },
  { value: "escalate-human", label: "Escalate to human" },
  { value: "schedule-follow-up", label: "Schedule follow-up", needsValue: true },
]

export function labelFor<T extends string>(options: { value: T; label: string }[], value: T) {
  return options.find((o) => o.value === value)?.label ?? value
}
