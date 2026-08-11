"use client"

import * as React from "react"

/**
 * Factory for a tiny per-domain Context store backing the demo's mutable
 * state (posts, conversations, comments, automations, knowledge sources).
 *
 * These are in-memory only — mutations live for the browser session and
 * reset on reload. That's intentional for Phase 2: it proves the UI flows
 * (create → schedule → appears in calendar, reply → appears in thread)
 * without a real backend. Swapping in persistence later means replacing
 * `useState` here with real fetch/mutate calls; no consuming component
 * needs to change.
 */
export function createListStore<T extends { id: string }>(seed: T[]) {
  interface StoreValue {
    items: T[]
    setItems: React.Dispatch<React.SetStateAction<T[]>>
  }

  const Context = React.createContext<StoreValue | null>(null)

  function Provider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = React.useState<T[]>(seed)
    const value = React.useMemo(() => ({ items, setItems }), [items])
    return <Context.Provider value={value}>{children}</Context.Provider>
  }

  function useRawStore() {
    const ctx = React.useContext(Context)
    if (!ctx) {
      throw new Error("Store hook used outside its Provider")
    }
    return ctx
  }

  return { Provider, useRawStore }
}
