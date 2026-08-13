import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { claimJobs, completeJob, failJob, type JobType } from "@/lib/jobs/queue"
import { JOB_HANDLERS } from "@/lib/jobs/handlers"
import { pruneExpiredOAuthStates } from "@/lib/integrations/oauth"
import { apiError } from "@/lib/api/errors"

/**
 * Internal worker endpoint - not a public cron trigger. Gated by a
 * dedicated CRON_SECRET (never SETUP_TOKEN/CACHE_PURGE_TOKEN) supplied via
 * header. Meant to be invoked periodically by a cPanel "Cron Job" hitting
 * this URL with curl, since there is no persistent worker process on
 * shared hosting.
 */
export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    return NextResponse.json({ error: "Cron worker is not enabled" }, { status: 403 })
  }
  const provided = request.headers.get("x-cron-secret")
  if (provided !== expected) {
    return NextResponse.json({ error: "Invalid cron secret" }, { status: 403 })
  }

  try {
    const workerId = `web-${randomUUID().slice(0, 8)}`
    const batch = await claimJobs(workerId, 5)

    const results = await Promise.all(
      batch.map(async (job) => {
        const handler = JOB_HANDLERS[job.type as JobType]
        if (!handler) {
          await failJob(job.id, job.attempts, job.maxAttempts, `No handler registered for job type "${job.type}"`)
          return { id: job.id, type: job.type, ok: false }
        }
        try {
          await handler(job)
          await completeJob(job.id)
          return { id: job.id, type: job.type, ok: true }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown job error"
          await failJob(job.id, job.attempts, job.maxAttempts, message)
          return { id: job.id, type: job.type, ok: false, error: message }
        }
      })
    )

    const prunedStates = await pruneExpiredOAuthStates()

    return NextResponse.json({ claimed: batch.length, results, prunedOAuthStates: prunedStates })
  } catch (error) {
    return apiError(error, "Cron worker run failed")
  }
}
