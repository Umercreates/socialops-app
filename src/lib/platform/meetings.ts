import { randomUUID } from "node:crypto"
import { and, eq } from "drizzle-orm"
import { withDb } from "@/lib/db/client"
import { meetings } from "@/lib/db/schema"

export interface Meeting {
  id: string
  workspaceId: string
  leadId: string | null
  title: string
  description: string | null
  startTime: string
  endTime: string
  timezone: string
  attendeeEmails: string[]
  assignedToUserId: string | null
  status: string
  calendarId: string | null
  externalEventId: string | null
  eventUrl: string | null
  meetLink: string | null
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}

function rowToMeeting(row: typeof meetings.$inferSelect): Meeting {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    leadId: row.leadId,
    title: row.title,
    description: row.description,
    startTime: row.startTime.toISOString(),
    endTime: row.endTime.toISOString(),
    timezone: row.timezone,
    attendeeEmails: row.attendeeEmails,
    assignedToUserId: row.assignedToUserId,
    status: row.status,
    calendarId: row.calendarId,
    externalEventId: row.externalEventId,
    eventUrl: row.eventUrl,
    meetLink: row.meetLink,
    errorMessage: row.errorMessage,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export interface CreateMeetingInput {
  workspaceId: string
  leadId?: string | null
  title: string
  description?: string
  startTime: string
  endTime: string
  timezone: string
  attendeeEmails: string[]
  assignedToUserId?: string | null
  createdByUserId: string | null
  /** "scheduled" once a real calendar event exists, "pending" if the
   * caller hasn't attempted calendar creation yet (never used today - the
   * create flow always attempts creation before persisting - kept for a
   * future async creation path). */
  status?: string
}

export async function createMeeting(input: CreateMeetingInput): Promise<Meeting> {
  return withDb(async (db) => {
    const [row] = await db
      .insert(meetings)
      .values({
        id: randomUUID(),
        workspaceId: input.workspaceId,
        leadId: input.leadId ?? null,
        title: input.title,
        description: input.description ?? null,
        startTime: new Date(input.startTime),
        endTime: new Date(input.endTime),
        timezone: input.timezone,
        attendeeEmails: input.attendeeEmails,
        assignedToUserId: input.assignedToUserId ?? null,
        status: input.status ?? "scheduled",
        createdByUserId: input.createdByUserId,
      })
      .returning()
    return rowToMeeting(row)
  })
}

export async function getMeeting(workspaceId: string, id: string): Promise<Meeting | null> {
  return withDb(async (db) => {
    const rows = await db.select().from(meetings).where(and(eq(meetings.id, id), eq(meetings.workspaceId, workspaceId))).limit(1)
    return rows[0] ? rowToMeeting(rows[0]) : null
  })
}

export async function listMeetings(workspaceId: string, leadId?: string): Promise<Meeting[]> {
  return withDb(async (db) => {
    const condition = leadId ? and(eq(meetings.workspaceId, workspaceId), eq(meetings.leadId, leadId)) : eq(meetings.workspaceId, workspaceId)
    const rows = await db.select().from(meetings).where(condition)
    return rows.map(rowToMeeting)
  })
}

/** Records the real outcome of attempting to create the Google Calendar
 * event behind a meeting - calendarId/externalEventId/eventUrl/meetLink
 * are only ever set here, from the provider's own response, never
 * fabricated at meeting-creation time. */
export async function recordCalendarEventResult(
  workspaceId: string,
  meetingId: string,
  result: { calendarId: string; externalEventId?: string; eventUrl?: string; meetLink?: string; errorMessage?: string }
): Promise<void> {
  await withDb(async (db) => {
    await db
      .update(meetings)
      .set({
        calendarId: result.calendarId,
        externalEventId: result.externalEventId ?? null,
        eventUrl: result.eventUrl ?? null,
        meetLink: result.meetLink ?? null,
        errorMessage: result.errorMessage ?? null,
        updatedAt: new Date(),
      })
      .where(and(eq(meetings.id, meetingId), eq(meetings.workspaceId, workspaceId)))
  })
}

export async function updateMeetingStatus(workspaceId: string, id: string, status: string): Promise<Meeting | null> {
  return withDb(async (db) => {
    const [row] = await db
      .update(meetings)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(meetings.id, id), eq(meetings.workspaceId, workspaceId)))
      .returning()
    return row ? rowToMeeting(row) : null
  })
}
