"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, CircleAlert, MailCheck, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { mockRequestPasswordReset } from "@/lib/auth/mock-auth"
import { useAuth } from "@/lib/auth/auth-context"

export function ForgotPasswordForm() {
  const { authMode } = useAuth()
  const [email, setEmail] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [isSent, setIsSent] = React.useState(false)

  // No email provider exists yet (Phase 3+) — never fake a "sent" success
  // for a real production account, only for the mock demo flow.
  if (authMode === "production") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
          <Mail className="size-5.5 text-muted-foreground" strokeWidth={1.75} />
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Password recovery isn&apos;t set up yet</h1>
          <p className="text-sm text-muted-foreground text-balance">
            Self-service email reset hasn&apos;t been configured for this workspace yet. Contact your workspace owner
            to have your password reset directly.
          </p>
        </div>
        <Button render={<Link href="/login" />} nativeButton={false} variant="outline" className="mt-2 w-full">
          <ArrowLeft />
          Back to sign in
        </Button>
      </div>
    )
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    const result = await mockRequestPasswordReset(email)
    setIsSubmitting(false)

    if (!result.ok) {
      setError(result.error ?? "Something went wrong. Try again.")
      return
    }
    setIsSent(true)
  }

  if (isSent) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-success/10">
          <MailCheck className="size-5.5 text-success" strokeWidth={1.75} />
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Check your email</h1>
          <p className="text-sm text-muted-foreground text-balance">
            If an account exists for <span className="font-medium text-foreground">{email}</span>, we sent a link to
            reset your password.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          This is a demo — no email was actually sent.
        </p>
        <Button render={<Link href="/login" />} nativeButton={false} variant="outline" className="mt-2 w-full">
          <ArrowLeft />
          Back to sign in
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Reset your password</h1>
        <p className="text-sm text-muted-foreground">
          Enter the email tied to your workspace and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {error && (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-10"
            placeholder="you@company.com"
            aria-invalid={Boolean(error)}
          />
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isSubmitting ? "Sending link…" : "Send reset link"}
        </Button>
      </form>

      <Link
        href="/login"
        className="flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to sign in
      </Link>
    </div>
  )
}
