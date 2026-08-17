import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth, requireRole } from "@/lib/auth/guard"
import { verifySameOrigin } from "@/lib/auth/csrf"
import { listWorkspaceMembers, inviteMember } from "@/lib/platform/team"
import { apiError } from "@/lib/api/errors"

export async function GET() {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const members = await listWorkspaceMembers(auth.ctx.workspaceId)
    return NextResponse.json({ members })
  } catch (error) {
    return apiError(error, "Failed to load team members")
  }
}

const inviteSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().email(),
  role: z.enum(["owner", "admin", "manager", "sales"]),
})

/** Only owner/admin can invite, and only an existing owner can grant the
 * owner role - an admin inviting someone shouldn't be able to hand out
 * ownership-level access. */
export async function POST(request: Request) {
  const originCheck = verifySameOrigin(request)
  if (originCheck) return originCheck

  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const roleCheck = requireRole(auth.ctx, ["owner", "admin"])
    if (roleCheck) return roleCheck

    const body = inviteSchema.parse(await request.json())
    if (body.role === "owner" && auth.ctx.role !== "owner") {
      return NextResponse.json({ error: "Only an owner can invite another owner." }, { status: 403 })
    }

    const result = await inviteMember({ workspaceId: auth.ctx.workspaceId, name: body.name, email: body.email, role: body.role })
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 })

    return NextResponse.json({ member: result.member, temporaryPassword: result.temporaryPassword }, { status: 201 })
  } catch (error) {
    return apiError(error, "Failed to invite team member")
  }
}
