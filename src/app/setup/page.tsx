import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { AuthShell } from "@/components/auth/auth-shell"
import { SetupForm } from "@/components/auth/setup-form"
import { hasAnyUsers, bootstrapFirstOwner, type BootstrapResult } from "@/lib/auth/bootstrap"
import { isPasswordStrongEnough, MIN_PASSWORD_LENGTH } from "@/lib/auth/password"

export const metadata: Metadata = {
  title: "Set up EasyLife",
}

/** Server Action — runs entirely server-side, so no SETUP_TOKEN or other
 * secret ever needs to reach client JS for this page to work. The real
 * guarantee is the same one /api/setup enforces: this can only ever
 * succeed once, while zero users exist in the database. */
async function createFirstOwner(_prevState: BootstrapResult | null, formData: FormData): Promise<BootstrapResult> {
  "use server"

  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")
  const confirmPassword = String(formData.get("confirmPassword") ?? "")

  if (!name || !email || !password) {
    return { ok: false, error: "Fill in every field to continue." }
  }
  if (password !== confirmPassword) {
    return { ok: false, error: "Passwords don't match." }
  }
  if (!isPasswordStrongEnough(password)) {
    return { ok: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` }
  }

  let result: BootstrapResult
  try {
    result = await bootstrapFirstOwner({ name, email, password })
  } catch {
    return { ok: false, error: "Couldn't reach the database. Try again in a moment." }
  }

  if (!result.ok) return result

  redirect("/login?setup=complete")
}

export default async function SetupPage() {
  let alreadyDone = false
  try {
    alreadyDone = await hasAnyUsers()
  } catch {
    // If the database itself is unreachable, fall through to the form —
    // submitting will fail with a clear error rather than silently hiding it.
  }

  if (alreadyDone) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Setup already complete</h1>
          <p className="text-sm text-muted-foreground text-balance">
            An owner account already exists for this workspace. Sign in instead, or contact your workspace owner if
            you need access.
          </p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <SetupForm action={createFirstOwner} />
    </AuthShell>
  )
}
