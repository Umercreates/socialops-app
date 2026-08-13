import { NextResponse } from "next/server"
import { pingDatabase } from "@/lib/db/client"

/** Safe production health check — never returns host/user/db name/connection
 * string/password/stack traces, only ok/degraded status flags. */
export async function GET() {
  const databaseOk = process.env.DATABASE_URL ? await pingDatabase() : null

  const status = databaseOk === false ? "degraded" : "ok"

  return NextResponse.json(
    {
      status,
      app: "ok",
      database: databaseOk === null ? "not_configured" : databaseOk ? "ok" : "unavailable",
    },
    { status: status === "ok" ? 200 : 503 }
  )
}
