import type { Metadata } from "next"
import { AuthShell } from "@/components/auth/auth-shell"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export const metadata: Metadata = {
  title: "Reset password — EasyLife",
}

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <ForgotPasswordForm />
    </AuthShell>
  )
}
