"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import type { User } from "@/types"
import {
  mockLogin,
  mockLogout,
  readMockSessionUser,
  readMockSessionUserServerSnapshot,
  subscribeToSession,
} from "@/lib/auth/mock-auth"

export interface LoginInput {
  email: string
  password: string
  rememberMe: boolean
}

export interface LoginResult {
  ok: boolean
  error?: string
}

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  authMode: "mock" | "production"
  login: (input: LoginInput) => Promise<LoginResult>
  logout: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

/** AUTH_MODE is resolved server-side per-request (see app/layout.tsx) and
 * passed down as a prop rather than read from an env var here — client
 * components can't safely read a non-NEXT_PUBLIC_ env var, and baking the
 * mode into the client bundle would mean a live AUTH_MODE flip in
 * production wouldn't take effect without a full rebuild. */
export function AuthProvider({ children, authMode }: { children: React.ReactNode; authMode: "mock" | "production" }) {
  if (authMode === "production") {
    return <ProductionAuthProvider>{children}</ProductionAuthProvider>
  }
  return <MockAuthProvider>{children}</MockAuthProvider>
}

function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const user = React.useSyncExternalStore(subscribeToSession, readMockSessionUser, readMockSessionUserServerSnapshot)

  const login = React.useCallback(async (input: LoginInput) => {
    return mockLogin(input)
  }, [])

  const logout = React.useCallback(async () => {
    await mockLogout()
    router.push("/login")
    router.refresh()
  }, [router])

  const value = React.useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, isLoading: false, authMode: "mock", login, logout }),
    [user, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function ProductionAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = React.useState<User | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false

    async function refreshUser() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "same-origin" })
        if (cancelled) return
        if (!res.ok) {
          setUser(null)
          return
        }
        const data = await res.json()
        if (cancelled) return
        setUser({ id: data.user.id, name: data.user.name, email: data.user.email, role: data.user.role })
      } catch {
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    refreshUser()
    return () => {
      cancelled = true
    }
  }, [])

  const login = React.useCallback(async (input: LoginInput): Promise<LoginResult> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(input),
      })
      const data = await res.json()
      if (!res.ok) {
        return { ok: false, error: data.error ?? "Something went wrong. Try again." }
      }
      setUser({ id: data.user.id, name: data.user.name, email: data.user.email, role: data.user.role })
      return { ok: true }
    } catch {
      return { ok: false, error: "Can't reach the server right now. Try again." }
    }
  }, [])

  const logout = React.useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" })
    } catch {
      // Even if the request fails, still clear local state and navigate away.
    }
    setUser(null)
    router.push("/login")
    router.refresh()
  }, [router])

  const value = React.useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, isLoading, authMode: "production", login, logout }),
    [user, isLoading, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
