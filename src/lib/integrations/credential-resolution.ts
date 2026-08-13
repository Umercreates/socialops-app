import { PROVIDER_REGISTRY, type ProviderId } from "./providers"
import { decryptSecret } from "./crypto"
import type { IntegrationConnectionRow } from "./repository"

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

  return { value: null, source: "none" }
}
