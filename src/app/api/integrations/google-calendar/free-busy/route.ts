import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth } from "@/lib/auth/guard"
import { resolveActiveConnection } from "@/lib/integrations/credential-resolution"
import { resolveCredentialValue } from "@/lib/integrations/service"
import { checkFreeBusy } from "@/lib/integrations/google-calendar/client"
import { apiError } from "@/lib/api/errors"

const querySchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
})

/** Real availability check against the workspace's selected calendar - a
 * practical conflict-warning layer for the booking dialog, not a full
 * scheduling product. Blocked (not failed) when Calendar isn't ready,
 * same honest-gap contract as every other provider check. */
export async function GET(request: Request) {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const url = new URL(request.url)
    const parsed = querySchema.safeParse({ start: url.searchParams.get("start"), end: url.searchParams.get("end") })
    if (!parsed.success) return NextResponse.json({ error: "start and end must be valid ISO datetimes." }, { status: 400 })

    const { live, row } = await resolveActiveConnection(auth.ctx.workspaceId, "google-calendar")
    if (!live) return NextResponse.json({ error: "Google Calendar isn't connected and activated for this workspace." }, { status: 400 })

    const { value: accessToken } = resolveCredentialValue(row, "accessToken", "google-calendar")
    if (!accessToken) return NextResponse.json({ error: "No Google access token on file - reconnect Google in Integrations." }, { status: 400 })

    const calendarId = row?.config?.calendarId
    if (typeof calendarId !== "string") return NextResponse.json({ error: "No calendar selected for this workspace - choose one in Integrations." }, { status: 400 })

    const result = await checkFreeBusy(accessToken, calendarId, parsed.data.start, parsed.data.end)
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 })

    return NextResponse.json({ busy: result.busy })
  } catch (error) {
    return apiError(error, "Failed to check calendar availability")
  }
}
