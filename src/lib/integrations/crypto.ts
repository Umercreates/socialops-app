import { randomBytes, createCipheriv, createDecipheriv, scryptSync } from "node:crypto"

/**
 * AES-256-GCM at-rest encryption for provider credentials. Node's built-in
 * `crypto` only — no third-party crypto library, no homemade cipher
 * construction beyond correctly wiring the vetted primitive (random IV per
 * record, authenticated encryption via the GCM auth tag).
 *
 * `INTEGRATIONS_ENCRYPTION_KEY` is a server-only secret (never NEXT_PUBLIC_,
 * never logged). It's stretched through scrypt into a 32-byte key rather
 * than used raw, so the env var itself doesn't have to be exactly 32 bytes.
 */

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12 // recommended GCM nonce length
const SALT = "easylife-integrations-v1" // fixed, non-secret — scrypt still needs the real secrecy from INTEGRATIONS_ENCRYPTION_KEY

let cachedKey: Buffer | null = null

function getKey(): Buffer {
  if (cachedKey) return cachedKey
  const secret = process.env.INTEGRATIONS_ENCRYPTION_KEY
  if (!secret) throw new Error("INTEGRATIONS_ENCRYPTION_KEY is not configured")
  cachedKey = scryptSync(secret, SALT, 32)
  return cachedKey
}

export interface EncryptedPayload {
  /** base64: iv + authTag + ciphertext, concatenated — one column, one string. */
  blob: string
}

export function encryptSecret(plaintext: string): EncryptedPayload {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()
  const blob = Buffer.concat([iv, authTag, ciphertext]).toString("base64")
  return { blob }
}

/** Returns `null` on any failure (wrong key, tampered ciphertext, corrupt
 * data) rather than throwing — callers must treat that as "unavailable,"
 * never as an empty-string credential. */
export function decryptSecret(blob: string): string | null {
  try {
    const key = getKey()
    const raw = Buffer.from(blob, "base64")
    const iv = raw.subarray(0, IV_LENGTH)
    const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + 16)
    const ciphertext = raw.subarray(IV_LENGTH + 16)
    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()])
    return plaintext.toString("utf8")
  } catch {
    return null
  }
}

/** Safe display form for a saved secret — last 4 characters only, never
 * enough to reconstruct or meaningfully narrow down the real value. */
export function maskSecret(plaintext: string): string {
  if (plaintext.length <= 4) return "••••"
  return `••••••••${plaintext.slice(-4)}`
}
