/**
 * Single source of truth for "is this a live integration or a simulation."
 *
 * This build ships with no real credentials for WhatsApp, telephony,
 * Google Calendar, or Google Sheets, so every integration module in
 * `src/lib/integrations/*` runs in demo mode: actions resolve locally
 * against mock data instead of calling a real API.
 *
 * Wiring up a real provider later means two things, per integration:
 * 1. Adding its real credentials as environment variables (none exist yet —
 *    this file does not invent or reference any).
 * 2. Making that integration's `isConfigured()` check for them and, when
 *    present, routing its actions to the real API instead of the mock path.
 *
 * No component should check this flag directly — they call the integration
 * functions, which already branch on it internally.
 */
export const DEMO_MODE = true
