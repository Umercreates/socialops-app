import { TEAM_MEMBERS } from "@/lib/data/settings"
import type { Call, Lead, Meeting } from "@/types"

/**
 * Google Sheets sync integration seam — a free, simple lead-export target
 * many small businesses already use. A real implementation needs a Google
 * Cloud project + the Sheets API + a service account or OAuth grant; none
 * of that exists here, so every "sync" below is a local no-op that just
 * moves the demo counters. UI surfaces must always label this as
 * simulated — never claim a real sheet is synced. Real per-workspace
 * status comes from useProviderStatus("google-sheets"), never from a
 * DEMO_MODE flag (see src/lib/store/sheets-store.tsx).
 */

export const LEAD_SHEET_COLUMNS = [
  "Lead ID",
  "Date",
  "Name",
  "WhatsApp Number",
  "Email",
  "Company",
  "Location",
  "Source Platform",
  "Campaign",
  "Original Post",
  "Original DM",
  "Interested Service",
  "Requirement",
  "Pain Point",
  "Budget",
  "Timeline",
  "Lead Score",
  "Lead Status",
  "Call Status",
  "Call Summary",
  "Objections",
  "Meeting Status",
  "Meeting Date",
  "Meeting Time",
  "Assigned Sales Person",
  "Next Action",
  "Follow-up Date",
  "Notes",
] as const

export type LeadSheetRow = Record<(typeof LEAD_SHEET_COLUMNS)[number], string>

/** Builds the exact row a real `sheets.spreadsheets.values.append` call
 * would send — kept separate from the (simulated) network call so the
 * shape is easy to unit-test and easy to swap to a real client later. */
export function buildLeadSheetRow(lead: Lead, latestCall?: Call, meeting?: Meeting): LeadSheetRow {
  const assignee = TEAM_MEMBERS.find((m) => m.id === lead.assignedTo)
  return {
    "Lead ID": lead.id,
    Date: lead.createdAt.slice(0, 10),
    Name: lead.name,
    "WhatsApp Number": lead.whatsappNumber ?? "",
    Email: lead.email ?? "",
    Company: lead.company ?? "",
    Location: lead.qualification.location ?? lead.city ?? "",
    "Source Platform": lead.source.platform,
    Campaign: lead.source.campaign ?? "",
    "Original Post": lead.source.originalPostExcerpt ?? "",
    "Original DM": lead.source.originalCommentExcerpt ?? "",
    "Interested Service": lead.qualification.serviceInterested ?? "",
    Requirement: lead.qualification.requirement ?? "",
    "Pain Point": lead.qualification.painPoint ?? "",
    Budget: lead.qualification.budget ?? "",
    Timeline: lead.qualification.timeline ?? "",
    "Lead Score": String(lead.score),
    "Lead Status": lead.status,
    "Call Status": lead.callStatus ?? "",
    "Call Summary": latestCall?.summary?.recommendedNextAction ?? "",
    Objections: latestCall?.summary?.objections ?? "",
    "Meeting Status": lead.meetingStatus ?? "",
    "Meeting Date": meeting?.date ?? "",
    "Meeting Time": meeting?.time ?? "",
    "Assigned Sales Person": assignee?.name ?? "",
    "Next Action": latestCall?.summary?.recommendedNextAction ?? "",
    "Follow-up Date": lead.nextFollowUpAt?.slice(0, 10) ?? "",
    Notes: lead.notes,
  }
}

/** Simulated — a real integration calls sheets.spreadsheets.values.append
 * with the row from `buildLeadSheetRow`. */
export async function simulateSyncLeadToSheet(lead: Lead, latestCall?: Call, meeting?: Meeting): Promise<{ ok: boolean; row: LeadSheetRow }> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  return { ok: true, row: buildLeadSheetRow(lead, latestCall, meeting) }
}

export async function simulateTestConnection(): Promise<{ ok: boolean; message: string }> {
  await new Promise((resolve) => setTimeout(resolve, 700))
  return { ok: false, message: "No Google Sheets credentials configured — this is a demo-mode simulation." }
}
