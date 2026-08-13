import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { DatabaseUnavailableError } from "@/lib/db/client"

/**
 * Standardized safe API error responses — never leak stack traces, SQL,
 * or internal paths to the client. Logs the real error server-side (never
 * secrets: passwords/cookies/tokens/API keys/DATABASE_URL are never passed
 * into this function).
 */
export function apiError(error: unknown, fallbackMessage = "Something went wrong"): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "Invalid request", details: error.flatten() }, { status: 400 })
  }
  if (error instanceof DatabaseUnavailableError) {
    console.error("Database error:", error.cause instanceof Error ? error.cause.message : error.cause)
    return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 })
  }

  console.error(fallbackMessage + ":", error instanceof Error ? error.message : error)
  return NextResponse.json({ error: fallbackMessage }, { status: 500 })
}
