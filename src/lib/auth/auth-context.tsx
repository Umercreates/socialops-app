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
  type MockLoginInput,
} from "@/lib/auth/mock-auth"

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  login: (input: MockLoginInput) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const user = React.useSyncExternalStore(subscribeToSession, readMockSessionUser, readMockSessionUserServerSnapshot)

  const login = React.useCallback(async (input: MockLoginInput) => {
    return mockLogin(input)
  }, [])

  const logout = React.useCallback(async () => {
    await mockLogout()
    router.push("/login")
    router.refresh()
  }, [router])

  const value = React.useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, login, logout }),
    [user, login, logout]
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
