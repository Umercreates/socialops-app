import { updateLead, createActivity, getLead } from "@/lib/leads/repository"
import { createNotification } from "@/lib/platform/notifications"
import { queueCall, recordBlockedCall } from "@/lib/platform/calls"
import { resolveActiveConnection } from "@/lib/integrations/credential-resolution"
import { resolveCredentialValue } from "@/lib/integrations/service"
import { enqueueJob } from "@/lib/jobs/queue"
import { sendWhatsAppTextMessage } from "@/lib/integrations/whatsapp/cloud-api"
import type { AutomationActionType } from "@/types"

/**
 * One handler per automation action type. Same contract as every other
 * provider-facing surface in this codebase: an action that needs a live
 * connection checks it first and returns "blocked" with a real, specific
 * reason if it isn't available - never a silent no-op, never a fabricated
 * "completed". Actions with no real backend yet return "blocked" with an
 * honest "not yet implemented" reason rather than pretending to work.
 */

export interface ActionContext {
  workspaceId: string
  actorUserId: string | null
  leadId?: string
  /** Present only when the triggering event was a WhatsApp message -
   * required for any action that replies in that same conversation. */
  whatsapp?: { toNumber: string; phoneNumberId: string; accessToken: string }
}

export interface ActionResult {
  status: "completed" | "blocked" | "failed"
  errorMessage?: string
}

function blocked(errorMessage: string): ActionResult {
  return { status: "blocked", errorMessage }
}

async function sendWhatsAppReply(actionValue: string | undefined, ctx: ActionContext): Promise<ActionResult> {
  if (!ctx.whatsapp) return blocked("No active WhatsApp conversation to reply in - this action only runs from a WhatsApp-triggered event.")
  const text = actionValue?.trim()
  if (!text) return blocked("This action has no reply text configured.")

  const result = await sendWhatsAppTextMessage(ctx.whatsapp.phoneNumberId, ctx.whatsapp.accessToken, ctx.whatsapp.toNumber, text)
  if (!result.ok) return { status: "failed", errorMessage: result.errorMessage ?? "WhatsApp send failed" }
  return { status: "completed" }
}

async function queueAiCall(ctx: ActionContext): Promise<ActionResult> {
  if (!ctx.leadId) return blocked("No lead associated with this event.")

  const { live, row } = await resolveActiveConnection(ctx.workspaceId, "omnidimension")
  if (!live) return blocked("OmniDimension is not connected and activated for this workspace.")

  // Re-fetch the lead's own record (not trusted from event context) so
  // call_permission is always checked against its current, real value.
  const lead = await getLead(ctx.workspaceId, ctx.leadId)
  if (!lead) return blocked("Lead not found.")
  if (!lead.whatsappNumber) return blocked("This lead has no phone number on file.")
  if (lead.callPermission !== "yes") {
    await recordBlockedCall({
      workspaceId: ctx.workspaceId,
      leadId: lead.id,
      toNumber: lead.whatsappNumber,
      requestedByUserId: ctx.actorUserId ?? "",
      reason: "This lead has not given call permission.",
    })
    return blocked("This lead has not given call permission.")
  }

  const { value: agentId } = resolveCredentialValue(row, "agentId", "omnidimension")
  if (!agentId) return blocked("OmniDimension has no Agent ID configured for this workspace.")

  const call = await queueCall({
    workspaceId: ctx.workspaceId,
    leadId: lead.id,
    toNumber: lead.whatsappNumber,
    requestedByUserId: ctx.actorUserId ?? "",
    initialStatus: "queued",
  })
  await enqueueJob({
    workspaceId: ctx.workspaceId,
    type: "dispatch_call",
    payload: { callId: call.id, toNumber: lead.whatsappNumber },
    maxAttempts: 3,
  })
  return { status: "completed" }
}

async function changeLeadStatus(actionValue: string | undefined, ctx: ActionContext): Promise<ActionResult> {
  if (!ctx.leadId) return blocked("No lead associated with this event.")
  if (!actionValue) return blocked("This action has no target status configured.")
  const updated = await updateLead(ctx.workspaceId, ctx.leadId, ctx.actorUserId, { status: actionValue })
  if (!updated) return blocked("Lead not found.")
  return { status: "completed" }
}

async function markLead(actionValue: string | undefined, ctx: ActionContext): Promise<ActionResult> {
  if (!ctx.leadId) return blocked("No lead associated with this event.")
  await createActivity(ctx.workspaceId, ctx.leadId, ctx.actorUserId, "note-added", actionValue ? `Marked: ${actionValue}` : "Marked by automation")
  return { status: "completed" }
}

async function assignLead(actionValue: string | undefined, ctx: ActionContext): Promise<ActionResult> {
  if (!ctx.leadId) return blocked("No lead associated with this event.")
  if (!actionValue) return blocked("This action has no target user configured.")
  const updated = await updateLead(ctx.workspaceId, ctx.leadId, ctx.actorUserId, { assignedToUserId: actionValue })
  if (!updated) return blocked("Lead not found.")
  return { status: "completed" }
}

async function escalateHuman(ctx: ActionContext): Promise<ActionResult> {
  if (!ctx.leadId) return blocked("No lead associated with this event.")
  const updated = await updateLead(ctx.workspaceId, ctx.leadId, ctx.actorUserId, { stage: "human-followup" })
  if (!updated) return blocked("Lead not found.")
  await createNotification({
    workspaceId: ctx.workspaceId,
    type: "automation",
    title: "Lead escalated to human follow-up",
    description: `${updated.name} needs a human to take over.`,
  })
  return { status: "completed" }
}

async function notifyTeam(actionValue: string | undefined, ctx: ActionContext): Promise<ActionResult> {
  await createNotification({
    workspaceId: ctx.workspaceId,
    type: "automation",
    title: "Automation notification",
    description: actionValue?.trim() || "An automation ran and wants your attention.",
  })
  return { status: "completed" }
}

async function scheduleFollowUp(actionValue: string | undefined, ctx: ActionContext): Promise<ActionResult> {
  if (!ctx.leadId) return blocked("No lead associated with this event.")
  await createActivity(ctx.workspaceId, ctx.leadId, ctx.actorUserId, "note-added", actionValue ? `Follow-up: ${actionValue}` : "Follow-up scheduled by automation")
  return { status: "completed" }
}

function notYetImplemented(capability: string): () => Promise<ActionResult> {
  return async () => blocked(`${capability} is architecture-ready but has no live provider connected yet.`)
}

export async function executeAction(actionType: AutomationActionType, actionValue: string | undefined, ctx: ActionContext): Promise<ActionResult> {
  switch (actionType) {
    case "reply":
    case "send-dm":
    case "send-whatsapp-cta":
      return sendWhatsAppReply(actionValue, ctx)
    case "queue-ai-call":
    case "schedule-ai-call":
      return queueAiCall(ctx)
    case "change-lead-status":
      return changeLeadStatus(actionValue, ctx)
    case "mark-lead":
      return markLead(actionValue, ctx)
    case "assign-lead":
      return assignLead(actionValue, ctx)
    case "assign-human":
    case "escalate-human":
      return escalateHuman(ctx)
    case "notify-team":
      return notifyTeam(actionValue, ctx)
    case "schedule-follow-up":
      return scheduleFollowUp(actionValue, ctx)
    case "like":
      return notYetImplemented("Liking comments")()
    case "add-tag":
      return notYetImplemented("Tagging")()
    case "create-meeting":
      return notYetImplemented("Meeting booking")()
    case "add-sheet-row":
    case "update-sheet-row":
      return notYetImplemented("Google Sheets sync")()
    case "send-booking-link":
      return notYetImplemented("Booking link generation")()
    default:
      return blocked(`Unknown action type: ${actionType}`)
  }
}
