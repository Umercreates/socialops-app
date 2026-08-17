import { NextResponse } from "next/server"
import { requireAuth, requireRole } from "@/lib/auth/guard"
import { resolveActiveConnection } from "@/lib/integrations/credential-resolution"
import { resolveCredentialValue } from "@/lib/integrations/service"
import { getMemberIdentity, listAdministeredOrganizations } from "@/lib/integrations/linkedin/client"
import { apiError } from "@/lib/api/errors"

/** Discovers who this workspace's connected LinkedIn account can publish
 * as: the member themselves, plus any company Page they administer -
 * the client picks one rather than pasting a URN. */
export async function GET() {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const roleCheck = requireRole(auth.ctx, ["owner", "admin"])
    if (roleCheck) return roleCheck

    const { live, row } = await resolveActiveConnection(auth.ctx.workspaceId, "linkedin")
    if (!live) return NextResponse.json({ error: "LinkedIn isn't connected and activated for this workspace." }, { status: 400 })
    const { value: accessToken } = resolveCredentialValue(row, "accessToken", "linkedin")
    if (!accessToken) return NextResponse.json({ error: "No LinkedIn access token on file - reconnect LinkedIn in Integrations." }, { status: 400 })

    const [member, orgs] = await Promise.all([getMemberIdentity(accessToken), listAdministeredOrganizations(accessToken)])
    if (!member.ok) return NextResponse.json({ error: member.error }, { status: 502 })

    return NextResponse.json({
      member: { urn: member.personUrn, name: member.name },
      organizations: orgs.ok ? orgs.organizations : [],
      organizationsError: orgs.ok ? null : orgs.error,
    })
  } catch (error) {
    return apiError(error, "Failed to discover LinkedIn identities")
  }
}
