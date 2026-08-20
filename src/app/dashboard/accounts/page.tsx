import type { Metadata } from "next"
import { AccountsPageContent } from "@/components/accounts/accounts-page-content"
import { DemoAccountsPageContent } from "@/components/accounts/demo-accounts-page-content"
import { getDashboardViewMode } from "@/lib/dashboard-view-mode"

export const metadata: Metadata = { title: "Social Accounts — EasyLife" }

export default async function SocialAccountsPage() {
  const viewMode = await getDashboardViewMode()
  return viewMode === "client" ? <AccountsPageContent /> : <DemoAccountsPageContent />
}
