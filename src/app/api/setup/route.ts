import { NextResponse } from "next/server"
import { z } from "zod"
import { hasAnyUsers, bootstrapFirstOwner } from "@/lib/auth/bootstrap"
import { isPasswordStrongEnough, MIN_PASSWORD_LENGTH } from "@/lib/auth/password"
import { verifySameOrigin } from "@/lib/auth/csrf"
import { apiError } from "@/lib/api/errors"

/**
 * Token-gated API path for the first-owner bootstrap — kept mainly so this
 * can be verified directly (e.g. via curl) without a browser. The real
 * user-facing path is the /setup page's Server Action, which needs no
 * token at all since it never exposes one to client JS. Both share the
 * same underlying guarantee: this only ever succeeds once, while zero
 * users exist. Remove SETUP_TOKEN from the production environment once
 * setup is complete to close this path off entirely.
 */

const setupSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().email(),
  password: z.string().min(1),
})

export async function GET() {
  try {
    const hasUsers = await hasAnyUsers()
    return NextResponse.json({ available: !hasUsers })
  } catch (error) {
    return apiError(error, "Failed to check setup status")
  }
}

export async function POST(request: Request) {
  const originCheck = verifySameOrigin(request)
  if (originCheck) return originCheck

  const expectedToken = process.env.SETUP_TOKEN
  if (!expectedToken) {
    return NextResponse.json({ error: "Setup is not enabled" }, { status: 403 })
  }
  const providedToken = request.headers.get("x-setup-token")
  if (providedToken !== expectedToken) {
    return NextResponse.json({ error: "Invalid setup token" }, { status: 403 })
  }

  try {
    const body = setupSchema.parse(await request.json())
    if (!isPasswordStrongEnough(body.password)) {
      return NextResponse.json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` }, { status: 400 })
    }

    const result = await bootstrapFirstOwner(body)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 409 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return apiError(error, "Setup failed")
  }
}
