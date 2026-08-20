import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth, requireRole } from "@/lib/auth/guard"
import { verifySameOrigin } from "@/lib/auth/csrf"
import { requireClientMode } from "@/lib/auth/dashboard-mode-guard"
import { isProviderId, PROVIDER_REGISTRY } from "@/lib/integrations/providers"
import { getProviderView, saveConnection, disableConnection, removeConnection } from "@/lib/integrations/service"
import { evaluateProviderReadiness } from "@/lib/integrations/readiness"
import { apiError } from "@/lib/api/errors"

export async function GET(_request: Request, ctx: { params: Promise<{ provider: string }> }) {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const roleCheck = requireRole(auth.ctx, ["owner", "admin", "manager"])
    if (roleCheck) return roleCheck

    const { provider } = await ctx.params
    if (!isProviderId(provider)) {
      return NextResponse.json({ error: "Unknown provider" }, { status: 404 })
    }

    const view = await getProviderView(auth.ctx.workspaceId, provider)
    return NextResponse.json({ provider: view })
  } catch (error) {
    return apiError(error, "Failed to load provider")
  }
}

const saveSchema = z.object({
  mode: z.enum(["disabled", "demo", "live"]).optional(),
  displayName: z.string().trim().max(200).optional(),
  fields: z.record(z.string(), z.string().max(4000)).default({}),
})

export async function PUT(request: Request, ctx: { params: Promise<{ provider: string }> }) {
  const originCheck = verifySameOrigin(request)
  if (originCheck) return originCheck

  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const roleCheck = requireRole(auth.ctx, ["owner", "admin"])
    if (roleCheck) return roleCheck
    const modeCheck = await requireClientMode()
    if (modeCheck) return modeCheck

    const { provider } = await ctx.params
    if (!isProviderId(provider)) {
      return NextResponse.json({ error: "Unknown provider" }, { status: 404 })
    }

    const def = PROVIDER_REGISTRY[provider]
    const body = saveSchema.parse(await request.json())

    // Reject unknown field keys outright — never persist arbitrary
    // caller-supplied keys into config/secret storage.
    const knownKeys = new Set(def.credentialFields.map((f) => f.key))
    for (const key of Object.keys(body.fields)) {
      if (!knownKeys.has(key)) {
        return NextResponse.json({ error: `Unknown credential field: ${key}` }, { status: 400 })
      }
    }
    if (body.mode && !def.supportedModes.includes(body.mode)) {
      return NextResponse.json({ error: `${def.name} does not support "${body.mode}" mode` }, { status: 400 })
    }

    // Live mode must be genuinely earned, never just requested - only a
    // provider that's already fully readiness-checked (existing credentials/
    // OAuth/webhook/passing test) can be flipped to live from here.
    if (body.mode === "live") {
      // Changing a credential value in this exact same call must never
      // reach live in one step - "readiness" below would otherwise reflect
      // a *previous* credential's passing test, not this new, untested one
      // (saveConnection clears that stale test-passed state after this
      // request, but only after the gate below has already run). Activating
      // live always requires its own separate Test Connection round trip.
      const changingFields = Object.values(body.fields).some((v) => v)
      if (changingFields) {
        return NextResponse.json(
          { error: "Save the new credentials, then run Test Connection again before activating live mode." },
          { status: 400 }
        )
      }

      const readiness = await evaluateProviderReadiness(auth.ctx.workspaceId, provider)
      if (!readiness.readyForLive) {
        return NextResponse.json(
          { error: "Cannot enable live mode yet.", missing: readiness.missing },
          { status: 400 }
        )
      }
    }

    const view = await saveConnection({
      workspaceId: auth.ctx.workspaceId,
      provider,
      actorUserId: auth.ctx.userId,
      mode: body.mode,
      displayName: body.displayName,
      fields: body.fields,
    })

    return NextResponse.json({ provider: view })
  } catch (error) {
    return apiError(error, "Failed to save provider configuration")
  }
}

export async function DELETE(request: Request, ctx: { params: Promise<{ provider: string }> }) {
  const originCheck = verifySameOrigin(request)
  if (originCheck) return originCheck

  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const roleCheck = requireRole(auth.ctx, ["owner", "admin"])
    if (roleCheck) return roleCheck
    const modeCheck = await requireClientMode()
    if (modeCheck) return modeCheck

    const { provider } = await ctx.params
    if (!isProviderId(provider)) {
      return NextResponse.json({ error: "Unknown provider" }, { status: 404 })
    }

    const url = new URL(request.url)
    const hard = url.searchParams.get("hard") === "true"

    if (hard) {
      await removeConnection(auth.ctx.workspaceId, provider, auth.ctx.userId)
    } else {
      await disableConnection(auth.ctx.workspaceId, provider, auth.ctx.userId)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return apiError(error, "Failed to remove provider configuration")
  }
}
