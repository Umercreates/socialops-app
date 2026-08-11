import type { LeadStage, LeadIntentStatus, CallPermission, CallStatus, MeetingStatus, LeadPriority } from "@/types"
import type { StatusTone } from "@/components/dashboard/status-badge"

export const LEAD_STAGE_ORDER: LeadStage[] = [
  "new",
  "social-dm",
  "whatsapp-started",
  "qualifying",
  "interested",
  "qualified",
  "call-scheduled",
  "called",
  "ready-for-sales",
  "human-followup",
  "meeting-booked",
  "won",
  "lost",
]

export const LEAD_STAGE_LABEL: Record<LeadStage, string> = {
  new: "New",
  "social-dm": "Social DM",
  "whatsapp-started": "WhatsApp Started",
  qualifying: "AI Qualifying",
  interested: "Interested",
  qualified: "Qualified",
  "call-scheduled": "AI Call",
  called: "Called",
  "ready-for-sales": "Ready for Sales",
  "human-followup": "Human Follow-up",
  "meeting-booked": "Meeting",
  won: "Won",
  lost: "Lost",
}

export const LEAD_PRIORITY_LABEL: Record<LeadPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
}

export const LEAD_PRIORITY_TONE: Record<LeadPriority, StatusTone> = {
  low: "neutral",
  medium: "warning",
  high: "error",
}

export const LEAD_STATUS_LABEL: Record<LeadIntentStatus, string> = {
  cold: "Cold",
  warm: "Warm",
  interested: "Interested",
  qualified: "Qualified",
  "not-interested": "Not Interested",
  "existing-customer": "Existing Customer",
  support: "Support",
  spam: "Spam",
  "human-review": "Human Review",
}

export const LEAD_STATUS_TONE: Record<LeadIntentStatus, StatusTone> = {
  cold: "neutral",
  warm: "warning",
  interested: "info",
  qualified: "success",
  "not-interested": "error",
  "existing-customer": "success",
  support: "info",
  spam: "error",
  "human-review": "warning",
}

export const CALL_PERMISSION_LABEL: Record<CallPermission, string> = {
  yes: "Yes",
  no: "No",
  unknown: "Unknown",
}

export const CALL_STATUS_LABEL: Record<CallStatus, string> = {
  ready: "Ready to Call",
  scheduled: "Scheduled",
  calling: "Calling",
  connected: "Connected",
  "no-answer": "No Answer",
  busy: "Busy",
  "call-back": "Call Back",
  interested: "Interested",
  "meeting-booked": "Meeting Booked",
  "not-interested": "Not Interested",
  failed: "Failed",
}

export const CALL_STATUS_TONE: Record<CallStatus, StatusTone> = {
  ready: "neutral",
  scheduled: "info",
  calling: "warning",
  connected: "success",
  "no-answer": "warning",
  busy: "warning",
  "call-back": "info",
  interested: "success",
  "meeting-booked": "success",
  "not-interested": "error",
  failed: "error",
}

export const MEETING_STATUS_LABEL: Record<MeetingStatus, string> = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  "no-show": "No Show",
}

export const MEETING_STATUS_TONE: Record<MeetingStatus, StatusTone> = {
  scheduled: "info",
  confirmed: "success",
  completed: "success",
  cancelled: "error",
  "no-show": "warning",
}
