/**
 * Single source of truth for "is this a live integration or a simulation."
 *
 * This build ships with no real credentials for WhatsApp, telephony,
 * Google Calendar, or Google Sheets, so every integration module in
 * `src/lib/integrations/*` runs in demo mode: actions resolve locally
 * against mock data instead of calling a real API. (Gemini is the one
 * exception with real credentials — see `src/lib/services/gemini-client.ts`,
 * which is called from a Route Handler and falls back to a local template
 * on any failure, independent of this flag.)
 *
 * Wiring up a real provider later means two things, per integration:
 * 1. Adding its real credentials as environment variables.
 * 2. Making that integration's `isConfigured()` check for them and, when
 *    present, routing its actions to the real API instead of the mock path.
 *
 * No component should check this flag directly — they call the integration
 * functions, which already branch on it internally.
 *
 * `DEMO_MODE` reads `process.env.DEMO_MODE` (set in `.env.local`), defaulting
 * to demo when unset. This file is imported transitively into client
 * components, and Next.js only inlines `NEXT_PUBLIC_*` vars into the browser
 * bundle — so in the browser this always evaluates the safe default (`true`);
 * the real value only takes effect in server-only code (Route Handlers,
 * server components).
 */
export const DEMO_MODE = process.env.DEMO_MODE !== "false"
