import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth, requireRole } from "@/lib/auth/guard"
import { verifySameOrigin } from "@/lib/auth/csrf"
import { bookMeeting } from "@/lib/integrations/google-calendar/booking"
import { listMeetings } from "@/lib/platform/meetings"
import { apiError } from "@/lib/api/errors"

export async function GET(request: Request) {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const leadId = new URL(request.url).searchParams.get("leadId") ?? undefined
    const meetings = await listMeetings(auth.ctx.workspaceId, leadId)
    return NextResponse.json({ meetings })
  } catch (error) {
    return apiError(error, "Failed to load meetings")
  }
}

const createSchema = z.object({
  leadId: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(300),
  description: z.string().max(5000).optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  attendeeEmails: z.array(z.string().email()).max(20).default([]),
  assignedToUserId: z.string().uuid().optional(),
})

/** Books a real meeting: a genuine Google Calendar event on the
 * workspace's selected calendar, with a real Meet link only if Google's
 * own response includes one. Blocked (not failed) when Google Calendar
 * isn't connected/configured - that's an honest setup gap, not an error. */
export async function POST(request: Request) {
  const originCheck = verifySameOrigin(request)
  if (originCheck) return originCheck

  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const roleCheck = requireRole(auth.ctx, ["owner", "admin", "manager"])
    if (roleCheck) return roleCheck

    const body = createSchema.parse(await request.json())
    if (new Date(body.endTime) <= new Date(body.startTime)) {
      return NextResponse.json({ error: "End time must be after start time." }, { status: 400 })
    }

    const result = await bookMeeting({
      workspaceId: auth.ctx.workspaceId,
      leadId: body.leadId,
      title: body.title,
      description: body.description,
      startTime: body.startTime,
      endTime: body.endTime,
      attendeeEmails: body.attendeeEmails,
      assignedToUserId: body.assignedToUserId,
      createdByUserId: auth.ctx.userId,
    })

    if (result.status === "blocked") return NextResponse.json({ error: result.errorMessage, meeting: result.meeting }, { status: 400 })
    if (result.status === "failed") return NextResponse.json({ error: result.errorMessage, meeting: result.meeting }, { status: 502 })
    return NextResponse.json({ meeting: result.meeting }, { status: 201 })
  } catch (error) {
    return apiError(error, "Failed to book meeting")
  }
}
