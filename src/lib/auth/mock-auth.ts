import { CURRENT_USER } from "@/lib/data/workspace"

/**
 * Mock authentication only. There is no backend behind this — it exists so
 * the authenticated shell has something real to gate against and so this
 * module can be swapped for a real provider (Auth.js, Clerk, Supabase, ...)
 * later without touching any component that calls `useAuth()`.
 *
 * The session cookie is the single source of truth: `proxy.ts` reads it on
 * the server to gate `/dashboard/*`, and the client reads the same cookie
 * to populate `useAuth()`. Keeping both sides on one value avoids the two
 * ever drifting out of sync.
 */

export const DEMO_CREDENTIALS = {
  email: "maya@easylife.co",
  password: "demo1234",
}

const SESSION_COOKIE = "so_session"

let sessionListeners: Array<() => void> = []

function notifySessionChange() {
  sessionListeners.forEach((listener) => listener())
}

/** For `useSyncExternalStore` — session only ever changes via `mockLogin`/`mockLogout`
 * in this tab, so no storage-event listener is needed. */
export function subscribeToSession(listener: () => void) {
  sessionListeners.push(listener)
  return () => {
    sessionListeners = sessionListeners.filter((l) => l !== listener)
  }
}

function setSessionCookie(rememberMe: boolean) {
  const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 12 // 30 days vs 12h
  const value = encodeURIComponent(JSON.stringify(CURRENT_USER))
  document.cookie = `${SESSION_COOKIE}=${value}; path=/; max-age=${maxAge}; samesite=lax`
}

function clearSessionCookie() {
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export interface MockLoginInput {
  email: string
  password: string
  rememberMe: boolean
}

export interface MockLoginResult {
  ok: boolean
  error?: string
}

export async function mockLogin({ email, password, rememberMe }: MockLoginInput): Promise<MockLoginResult> {
  await delay(650)

  const emailMatches = email.trim().toLowerCase() === DEMO_CREDENTIALS.email.toLowerCase()
  const passwordMatches = password === DEMO_CREDENTIALS.password

  if (!emailMatches || !passwordMatches) {
    return { ok: false, error: "That email and password don't match our records." }
  }

  setSessionCookie(rememberMe)
  notifySessionChange()
  return { ok: true }
}

export async function mockLogout(): Promise<void> {
  await delay(200)
  clearSessionCookie()
  notifySessionChange()
}

let cachedRawCookie: string | null | undefined
let cachedUser: typeof CURRENT_USER | null = null

/** `useSyncExternalStore` requires a stable reference when the underlying
 * value hasn't changed, so this only re-parses the cookie when its raw
 * string actually differs from the last read. */
export function readMockSessionUser() {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(/(?:^|;\s*)so_session=([^;]*)/)
  const raw = match ? match[1] : null

  if (raw === cachedRawCookie) return cachedUser

  cachedRawCookie = raw
  if (!raw) {
    cachedUser = null
    return cachedUser
  }
  try {
    cachedUser = JSON.parse(decodeURIComponent(raw)) as typeof CURRENT_USER
  } catch {
    cachedUser = null
  }
  return cachedUser
}

export function readMockSessionUserServerSnapshot() {
  return null
}

export async function mockRequestPasswordReset(email: string): Promise<MockLoginResult> {
  await delay(700)
  if (!email.trim() || !email.includes("@")) {
    return { ok: false, error: "Enter a valid email address." }
  }
  return { ok: true }
}

export async function mockResetPassword(password: string): Promise<MockLoginResult> {
  await delay(700)
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." }
  }
  return { ok: true }
}
