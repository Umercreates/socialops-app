import bcrypt from "bcryptjs"

/**
 * `bcryptjs` deliberately, not `bcrypt` — pure JS, no native binary. This
 * host's older glibc already broke one native binary (Next's SWC/Turbopack)
 * this session; there's no reason to risk a second class of that failure
 * for something as easily avoided as password hashing.
 */

const SALT_ROUNDS = 12
export const MIN_PASSWORD_LENGTH = 10

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function isPasswordStrongEnough(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}
