import { PROVIDER_REGISTRY, type ProviderId, type IntegrationMode, type IntegrationStatus } from "./providers"
import { encryptSecret, decryptSecret, maskSecret } from "./crypto"
import {
  getConnection,
  listConnections,
  upsertConnection,
  deleteConnection,
  recordTestResult,
  recordAuditEvent,
  type IntegrationConnectionRow,
} from "./repository"

/** Safe, client-facing view of a provider's connection state — never a raw
 * secret, only presence + a masked tail where that's safe to show. */
export interface ProviderConnectionView {
  provider: ProviderId
  name: string
  category: string
  description: string
  mode: IntegrationMode
  status: IntegrationStatus
  displayName: string | null
  config: Record<string, unknown>
  credentialFields: {
    key: string
    label: string
    secret: boolean
    required: boolean
    configured: boolean
    maskedValue: string | null
    source: "workspace" | "environment" | "none"
  }[]
  usingEnvFallback: boolean
  lastTestedAt: string | null
  lastSuccessAt: string | null
  lastErrorMessage: string | null
  updatedAt: string | null
}

/** Resolves a single credential field's plaintext value following the
 * documented precedence: workspace-specific encrypted DB value first, then
 * a server environment default, then unavailable. Never logs the value. */
export function resolveCredentialValue(
  row: IntegrationConnectionRow | null,
  fieldKey: string,
  provider: ProviderId
): { value: string | null; source: "workspace" | "environment" | "none" } {
  const encryptedBlob = row?.secretDataEncrypted?.[fieldKey]
  if (encryptedBlob) {
    const decrypted = decryptSecret(encryptedBlob)
    if (decrypted) return { value: decrypted, source: "workspace" }
  }

  const nonSecretValue = row?.config?.[fieldKey]
  if (typeof nonSecretValue === "string" && nonSecretValue) {
    return { value: nonSecretValue, source: "workspace" }
  }

  const envFallback = PROVIDER_REGISTRY[provider].envFallback
  if (envFallback && fieldKey === "apiKey") {
    const envValue = process.env[envFallback.envVar]
    if (envValue) return { value: envValue, source: "environment" }
  }

  return { value: null, source: "none" }
}

export async function getProviderView(workspaceId: string, provider: ProviderId): Promise<ProviderConnectionView> {
  const def = PROVIDER_REGISTRY[provider]
  const row = await getConnection(workspaceId, provider)

  const credentialFields = def.credentialFields.map((field) => {
    const resolved = resolveCredentialValue(row, field.key, provider)
    return {
      key: field.key,
      label: field.label,
      secret: field.secret,
      required: field.required,
      configured: resolved.value !== null,
      maskedValue: resolved.value && field.secret ? maskSecret(resolved.value) : resolved.value && !field.secret ? resolved.value : null,
      source: resolved.source,
    }
  })

  const usingEnvFallback = credentialFields.some((f) => f.source === "environment")

  return {
    provider,
    name: def.name,
    category: def.category,
    description: def.description,
    mode: (row?.mode as IntegrationMode) ?? "disabled",
    status: (row?.status as IntegrationStatus) ?? (usingEnvFallback ? "configured" : "not_configured"),
    displayName: row?.displayName ?? null,
    config: row?.config ?? {},
    credentialFields,
    usingEnvFallback,
    lastTestedAt: row?.lastTestedAt?.toISOString() ?? null,
    lastSuccessAt: row?.lastSuccessAt?.toISOString() ?? null,
    lastErrorMessage: row?.lastErrorMessage ?? null,
    updatedAt: row?.updatedAt?.toISOString() ?? null,
  }
}

export async function listProviderViews(workspaceId: string): Promise<ProviderConnectionView[]> {
  const rows = await listConnections(workspaceId)
  const rowsByProvider = new Map(rows.map((r) => [r.provider, r]))

  return (Object.keys(PROVIDER_REGISTRY) as ProviderId[]).map((provider) => {
    const def = PROVIDER_REGISTRY[provider]
    const row = rowsByProvider.get(provider) ?? null
    const credentialFields = def.credentialFields.map((field) => {
      const resolved = resolveCredentialValue(row, field.key, provider)
      return {
        key: field.key,
        label: field.label,
        secret: field.secret,
        required: field.required,
        configured: resolved.value !== null,
        maskedValue: resolved.value && field.secret ? maskSecret(resolved.value) : resolved.value && !field.secret ? resolved.value : null,
        source: resolved.source,
      }
    })
    const usingEnvFallback = credentialFields.some((f) => f.source === "environment")

    return {
      provider,
      name: def.name,
      category: def.category,
      description: def.description,
      mode: (row?.mode as IntegrationMode) ?? "disabled",
      status: (row?.status as IntegrationStatus) ?? (usingEnvFallback ? "configured" : "not_configured"),
      displayName: row?.displayName ?? null,
      config: row?.config ?? {},
      credentialFields,
      usingEnvFallback,
      lastTestedAt: row?.lastTestedAt?.toISOString() ?? null,
      lastSuccessAt: row?.lastSuccessAt?.toISOString() ?? null,
      lastErrorMessage: row?.lastErrorMessage ?? null,
      updatedAt: row?.updatedAt?.toISOString() ?? null,
    }
  })
}

export interface SaveConnectionInput {
  workspaceId: string
  provider: ProviderId
  actorUserId: string
  mode?: IntegrationMode
  displayName?: string
  /** Raw plaintext field values keyed by field key — secret fields get
   * encrypted here before ever touching the repository/DB layer; empty
   * strings are ignored (never overwrite a saved secret with blank). */
  fields: Record<string, string>
}

export async function saveConnection(input: SaveConnectionInput): Promise<ProviderConnectionView> {
  const def = PROVIDER_REGISTRY[input.provider]
  const config: Record<string, unknown> = {}
  const secretDataEncrypted: Record<string, string> = {}

  for (const field of def.credentialFields) {
    const value = input.fields[field.key]
    if (!value) continue
    if (field.secret) {
      secretDataEncrypted[field.key] = encryptSecret(value).blob
    } else {
      config[field.key] = value
    }
  }

  const existing = await getConnection(input.workspaceId, input.provider)
  const isFirstSave = !existing

  await upsertConnection({
    workspaceId: input.workspaceId,
    provider: input.provider,
    mode: input.mode,
    status: "configured",
    displayName: input.displayName,
    config,
    secretDataEncrypted,
  })

  await recordAuditEvent(
    input.workspaceId,
    input.provider,
    isFirstSave ? "integration_configured" : "integration_updated",
    input.actorUserId,
    { fieldsUpdated: Object.keys(input.fields).filter((k) => input.fields[k]) }
  )

  return getProviderView(input.workspaceId, input.provider)
}

export async function disableConnection(workspaceId: string, provider: ProviderId, actorUserId: string): Promise<void> {
  await upsertConnection({ workspaceId, provider, mode: "disabled", status: "disabled" })
  await recordAuditEvent(workspaceId, provider, "integration_disabled", actorUserId)
}

export async function removeConnection(workspaceId: string, provider: ProviderId, actorUserId: string): Promise<void> {
  await deleteConnection(workspaceId, provider)
  await recordAuditEvent(workspaceId, provider, "integration_deleted", actorUserId)
}

export interface TestConnectionResult {
  ok: boolean
  status: IntegrationStatus
  message: string
}

export async function recordConnectionTest(
  workspaceId: string,
  provider: ProviderId,
  actorUserId: string,
  result: TestConnectionResult
): Promise<void> {
  await recordTestResult(workspaceId, provider, {
    ok: result.ok,
    status: result.status,
    errorCode: result.ok ? undefined : "test_failed",
    errorMessage: result.ok ? undefined : result.message,
  })
  await recordAuditEvent(
    workspaceId,
    provider,
    result.ok ? "connection_test_succeeded" : "connection_test_failed",
    actorUserId
  )
}
