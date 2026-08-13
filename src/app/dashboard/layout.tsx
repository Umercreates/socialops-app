import { connection } from "next/server"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { getNotifications } from "@/lib/services/dashboard-service"

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const notifications = await getNotifications()

  // Forces this read to happen at request time — see app/layout.tsx for why.
  await connection()
  const crmMode = process.env.CRM_MODE === "database" ? "database" : "demo"

  return (
    <DashboardShell notifications={notifications} crmMode={crmMode}>
      {children}
    </DashboardShell>
  )
}
