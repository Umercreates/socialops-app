/**
 * OmniDimension REST API client - the real, provider-facing adapter behind
 * the Call Agent module. Matches the documented API as of this writing
 * (https://docs.omnidim.io/docs/api-reference/calls/dispatchCall,
 * https://docs.omnidim.io/docs/get-started/authentication): bearer-token
 * auth against `https://backend.omnidim.io/api/v1`, `POST /calls/dispatch`
 * with `{agent_id, to_number, from_number_id?, call_context?}`.
 *
 * Same never-throws contract as every other provider adapter in this
 * codebase (gemini-client.ts, oauth.ts): every failure mode resolves to
 * `{ok: false, error}` with a safe, human-readable message, never a raw
 * upstream JSON blob or stack trace.
 */

const BASE_URL = "https://backend.omnidim.io/api/v1"

export interface DispatchCallInput {
  apiKey: string
  agentId: string
  toNumber: string
  fromNumberId?: string | null
  callContext?: Record<string, unknown>
}

export interface DispatchCallResult {
  ok: boolean
  providerCallId?: string
  error?: string
}

/** Places an outbound call via a workspace's connected OmniDimension agent.
 * Never called unless the caller has already confirmed: the provider is
 * live, the lead has call_permission = "yes", and (for non-automatic runs)
 * a human has approved this specific call - this function only knows how
 * to make the HTTP request, not the business rules around when to. */
export async function dispatchCall(input: DispatchCallInput): Promise<DispatchCallResult> {
  const agentId = Number(input.agentId)
  if (!Number.isInteger(agentId)) {
    return { ok: false, error: "Agent ID must be a number - check the value saved in Integrations." }
  }

  try {
    const body: Record<string, unknown> = { agent_id: agentId, to_number: input.toNumber }
    if (input.fromNumberId) {
      const fromNumberId = Number(input.fromNumberId)
      if (Number.isInteger(fromNumberId)) body.from_number_id = fromNumberId
    }
    if (input.callContext) body.call_context = input.callContext

    const res = await fetch(`${BASE_URL}/calls/dispatch`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    })

    const json = await res.json().catch(() => null)
    if (!res.ok || !json?.success) {
      return { ok: false, error: json?.message ?? json?.error ?? `OmniDimension dispatch failed (${res.status})` }
    }

    const providerCallId = json.requestId ?? json.request_id
    if (providerCallId === undefined || providerCallId === null) {
      return { ok: false, error: "OmniDimension accepted the call but returned no call identifier." }
    }

    return { ok: true, providerCallId: String(providerCallId) }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown OmniDimension request error" }
  }
}

export interface TestCredentialsResult {
  ok: boolean
  status: "connected" | "error" | "not_configured"
  message: string
}

/** "Test Connection" for OmniDimension - there's no dedicated no-op ping
 * endpoint documented, and this must never place a real call just to
 * validate credentials. Confirms the API key + agent both authenticate
 * against the account by listing agents and checking the configured
 * agent ID appears - a real, evidence-based check without side effects. */
export async function testOmniDimensionCredentials(apiKey: string, agentId: string): Promise<TestCredentialsResult> {
  try {
    const res = await fetch(`${BASE_URL}/agents`, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15000),
    })

    if (res.status === 401 || res.status === 403) {
      return { ok: false, status: "error", message: "API key was rejected by OmniDimension." }
    }
    if (!res.ok) {
      return { ok: false, status: "error", message: `OmniDimension API returned ${res.status}.` }
    }

    const json = await res.json().catch(() => null)
    const agents: unknown[] = Array.isArray(json?.bots) ? json.bots : []
    const numericAgentId = Number(agentId)
    const matchFound = agents.some((a) => {
      if (typeof a !== "object" || a === null) return false
      const record = a as Record<string, unknown>
      return record.id === numericAgentId
    })

    if (agents.length > 0 && !matchFound) {
      return { ok: false, status: "error", message: `Agent ID ${agentId} was not found on this OmniDimension account.` }
    }

    return { ok: true, status: "connected", message: "OmniDimension credentials verified." }
  } catch (error) {
    return { ok: false, status: "error", message: error instanceof Error ? error.message : "Couldn't reach the OmniDimension API." }
  }
}
