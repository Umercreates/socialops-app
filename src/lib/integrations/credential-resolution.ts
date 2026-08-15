import { PROVIDER_REGISTRY, type ProviderId } from "./providers"
import { decryptSecret } from "./crypto"
import { getConnection, type IntegrationConnectionRow } from "./repository"

/**
 * Standalone module (not part of service.ts) specifically so
 * readiness.ts and service.ts can both depend on it without an import
 * cycle between them.
 *
 * Resolves a single credential field's plaintext value following the
 * documented precedence: workspace-specific encrypted DB value first, then
 * a server environment default, then unavailable. Never logs the value.
 */
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

  // Platform-operated OAuth app fallback: if EasyLife has registered its own
  // developer app for this provider (env vars set), a workspace that hasn't
  // entered its own Client ID/secret uses the platform's - so Connect
  // Account is the only step a client ever needs. A workspace that HAS
  // entered its own (the `perWorkspaceAppCredentials` path, e.g. an agency
  // reselling under its own app) is already handled above and takes
  // precedence over this fallback.
  const platformAppEnvVars = PROVIDER_REGISTRY[provider].oauth?.platformAppEnvVars
  if (platformAppEnvVars && (fieldKey === "clientId" || fieldKey === "clientSecret")) {
    const envVar = fieldKey === "clientId" ? platformAppEnvVars.clientId : platformAppEnvVars.clientSecret
    const envValue = process.env[envVar]
    if (envValue) return { value: envValue, source: "environment" }
  }

  return { value: null, source: "none" }
}

/**
 * The credential a real runtime call (AI generation, an outbound API call,
 * etc.) should actually use — as opposed to `resolveCredentialValue`, which
 * `getProviderView`/Test Connection also use to show *any* saved value
 * regardless of activation state. This is the "No Fake Live Mode" gate:
 * a workspace's saved key is only used once that workspace has explicitly
 * activated the provider (`mode === "live"`, only reachable after
 * `readyForLive` passed) — never merely because a value is sitting in the
 * config table. An unactivated (or unconfigured) workspace falls through to
 * the platform fallback, same as before any workspace ever configures it.
 */
export async function resolveActiveApiKey(
  workspaceId: string,
  provider: ProviderId
): Promise<{ value: string | null; source: "workspace" | "environment" | "none" }> {
  const row = await getConnection(workspaceId, provider)
  if (row?.mode === "live") {
    const resolved = resolveCredentialValue(row, "apiKey", provider)
    if (resolved.source === "workspace") return resolved
  }
  return resolveCredentialValue(null, "apiKey", provider)
}
