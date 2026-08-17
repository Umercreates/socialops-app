/**
 * Resolves the app's real public origin. Behind a reverse proxy (LiteSpeed
 * -> Passenger, as in production here), `request.url`'s origin reflects
 * the internal address the Node process is actually bound to (observed:
 * `https://localhost:3000`), not the public domain - anything that must be
 * byte-exact for an external party (OAuth `redirect_uri`, webhook URLs
 * shown in the UI) has to come from `APP_URL` instead. Falls back to the
 * request's own origin only when APP_URL isn't set, which keeps local
 * development working without extra configuration.
 */
export function getAppOrigin(request: Request): string {
  const configured = process.env.APP_URL?.trim()
  if (configured) return configured.replace(/\/+$/, "")
  return new URL(request.url).origin
}

/** For code with no incoming Request to fall back to - background job
 * handlers, for instance, which run from a cron dispatch rather than a
 * browser/external request. Requires APP_URL to be set (already required
 * in production for OAuth to work at all); throws rather than guessing,
 * since there's no safe fallback origin to hand to an external party. */
export function requireAppOrigin(): string {
  const configured = process.env.APP_URL?.trim()
  if (!configured) throw new Error("APP_URL is not configured")
  return configured.replace(/\/+$/, "")
}
