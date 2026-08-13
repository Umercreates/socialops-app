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
