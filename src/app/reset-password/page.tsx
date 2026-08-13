import type { Metadata } from "next"
import { AuthShell } from "@/components/auth/auth-shell"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export const metadata: Metadata = {
  title: "Set new password — EasyLife",
}

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <ResetPasswordForm />
    </AuthShell>
  )
}
