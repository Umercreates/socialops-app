import type { Metadata } from "next"
import { AccountsPageContent } from "@/components/accounts/accounts-page-content"

export const metadata: Metadata = { title: "Social Accounts — Easyland" }

export default function SocialAccountsPage() {
  return <AccountsPageContent />
}
