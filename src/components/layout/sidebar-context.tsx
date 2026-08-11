"use client"

import * as React from "react"

const STORAGE_KEY = "socialops:sidebar-collapsed"

let listeners: Array<() => void> = []
let cachedCollapsed: boolean | null = null

function readCollapsed() {
  if (cachedCollapsed === null) {
    cachedCollapsed = window.localStorage.getItem(STORAGE_KEY) === "1"
  }
  return cachedCollapsed
}

function readCollapsedServerSnapshot() {
  return false
}

function writeCollapsed(value: boolean) {
  cachedCollapsed = value
  window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0")
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

interface SidebarContextValue {
  isCollapsed: boolean
  toggleCollapsed: () => void
  isMobileOpen: boolean
  setIsMobileOpen: (open: boolean) => void
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const isCollapsed = React.useSyncExternalStore(subscribe, readCollapsed, readCollapsedServerSnapshot)
  const [isMobileOpen, setIsMobileOpen] = React.useState(false)

  const toggleCollapsed = React.useCallback(() => {
    writeCollapsed(!readCollapsed())
  }, [])

  const value = React.useMemo(
    () => ({ isCollapsed, toggleCollapsed, isMobileOpen, setIsMobileOpen }),
    [isCollapsed, toggleCollapsed, isMobileOpen]
  )

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}
