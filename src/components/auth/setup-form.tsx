"use client"

import * as React from "react"
import { useActionState } from "react"
import { Eye, EyeOff, Loader2, CircleAlert, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { BootstrapResult } from "@/lib/auth/bootstrap"

interface SetupFormProps {
  action: (prevState: BootstrapResult | null, formData: FormData) => Promise<BootstrapResult>
}

export function SetupForm({ action }: SetupFormProps) {
  const [state, formAction, isPending] = useActionState(action, null)
  const [showPassword, setShowPassword] = React.useState(false)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-brand" strokeWidth={1.75} />
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Create the owner account</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          This runs once. Choose your own name, email, and password — this page permanently disables itself the
          moment the account is created.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4" noValidate>
        {state && !state.ok && (
          <Alert variant="destructive" className="animate-in fade-in-0 slide-in-from-top-1 duration-200">
            <CircleAlert />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Your name</Label>
          <Input id="name" name="name" autoComplete="name" className="h-10" placeholder="Maya Reyes" required />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" className="h-10" placeholder="you@easylife.co" required />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              className="h-10 pr-10"
              placeholder="At least 10 characters"
              required
              minLength={10}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            className="h-10"
            placeholder="Re-enter your password"
            required
            minLength={10}
          />
        </div>

        <Button type="submit" size="lg" className="mt-1 w-full" disabled={isPending}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {isPending ? "Creating account…" : "Create owner account"}
        </Button>
      </form>
    </div>
  )
}
