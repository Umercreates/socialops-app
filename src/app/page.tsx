import { redirect } from "next/navigation"
import { cookies } from "next/headers"

/**
 * `proxy.ts` already redirects `/` before this ever renders. This is a
 * defense-in-depth fallback for any request path that bypasses proxy.
 */
export default async function RootPage() {
  const cookieStore = await cookies()
  const hasSession = cookieStore.has("so_session")
  redirect(hasSession ? "/dashboard" : "/login")
}
