"use client"

import * as React from "react"
import Link from "next/link"
import { Loader2, Plus } from "lucide-react"
import { AccountCard } from "@/components/accounts/account-card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth/auth-context"
import type { SocialAccount } from "@/types"

export function AccountsPageContent() {
  const { user } = useAuth()
  const canManage = user?.role === "owner" || user?.role === "admin"

  const [accounts, setAccounts] = React.useState<SocialAccount[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/social-accounts", { credentials: "same-origin" })
        if (!res.ok) throw new Error("Failed to load social accounts")
        const data = await res.json()
        if (!cancelled) setAccounts(data.accounts)
      } catch {
        if (!cancelled) setError("Couldn't load social accounts. Try refreshing.")
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleDisconnect(id: string) {
    const previous = accounts
    setAccounts((prev) => prev?.filter((a) => a.id !== id) ?? null)
    try {
      const res = await fetch(`/api/social-accounts/${id}`, { method: "DELETE", credentials: "same-origin" })
      if (!res.ok) throw new Error("Disconnect failed")
    } catch {
      setAccounts(previous ?? null)
      setError("Couldn't disconnect that account. Try again.")
    }
  }

  const connectedCount = accounts?.filter((a) => a.health !== "disconnected").length ?? 0

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 ease-out">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Social accounts</h2>
          <p className="text-sm text-muted-foreground">
            {accounts ? `${connectedCount} of ${accounts.length} connected. ` : ""}
            Accounts are added by connecting a provider in Integrations - never typed in here.
          </p>
        </div>
        {canManage && (
          <Button render={<Link href="/dashboard/integrations" />} nativeButton={false}>
            <Plus />
            Connect account
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!accounts ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading accounts...
        </div>
      ) : accounts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-16 text-center text-sm text-muted-foreground">
          No social accounts connected yet.{" "}
          {canManage ? (
            <Link href="/dashboard/integrations" className="text-brand hover:underline">
              Connect one in Integrations
            </Link>
          ) : (
            "Ask an owner or admin to connect one in Integrations."
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} now={new Date()} canManage={canManage} onDisconnect={handleDisconnect} />
          ))}
        </div>
      )}
    </div>
  )
}
