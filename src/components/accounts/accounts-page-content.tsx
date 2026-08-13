"use client"

import { useSocialAccounts } from "@/lib/store/accounts-store"
import { AccountCard } from "@/components/accounts/account-card"
import { ConnectAccountDialog } from "@/components/accounts/connect-account-dialog"
import { Button } from "@/components/ui/button"
import { MOCK_NOW } from "@/lib/data/constants"
import { Plus } from "lucide-react"

export function AccountsPageContent() {
  const { accounts } = useSocialAccounts()
  const connectedCount = accounts.filter((a) => a.health !== "disconnected").length

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 ease-out">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Social accounts</h2>
          <p className="text-sm text-muted-foreground">
            {connectedCount} of {accounts.length} platforms connected. Manage connections and account health here.
          </p>
        </div>
        <ConnectAccountDialog
          trigger={
            <Button>
              <Plus />
              Connect account
            </Button>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {accounts.map((account) => (
          <AccountCard key={account.id} account={account} now={MOCK_NOW} />
        ))}
      </div>
    </div>
  )
}
