"use client"

import * as React from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { AccountCard } from "@/components/accounts/account-card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth/auth-context"
import { useSocialAccounts } from "@/lib/store/accounts-store"

/** Demo Mode Accounts - same AccountCard UI as the real page, backed by the
 * demo store instead of /api/social-accounts. Disconnect mutates demo
 * state only, never a real DELETE request. */
export function DemoAccountsPageContent() {
  const { user } = useAuth()
  const canManage = user?.role === "owner" || user?.role === "admin"
  const { accounts, disconnect } = useSocialAccounts()

  const connectedCount = accounts.filter((a) => a.health !== "disconnected").length

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 ease-out">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Social accounts</h2>
          <p className="text-sm text-muted-foreground">
            {connectedCount} of {accounts.length} connected. Demo workspace - these are example connections, not real provider accounts.
          </p>
        </div>
        {canManage && (
          <Button render={<Link href="/dashboard/integrations" />} nativeButton={false}>
            <Plus />
            Connect account
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {accounts.map((account) => (
          <AccountCard key={account.id} account={account} now={new Date()} canManage={canManage} onDisconnect={disconnect} />
        ))}
      </div>
    </div>
  )
}
