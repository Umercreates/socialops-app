# Deploying to production (dashboard.easylife.com.pk)

GitHub `main` is the canonical source. Production secrets and the production
database live only on the XMart host, never in this repo. This file is the
standing runbook for pushing a new build live — read it before every deploy,
don't improvise a new sequence.

## Why this exists

Early deployments used cPanel's "extract with overwrite" to unzip a new
`.next` build on top of the old one. Overwrite-extraction only replaces files
present in the new archive — it never deletes files that are *absent* from
it. When a route's build output changes shape (e.g. a page moves from static
to dynamic and stops emitting `<route>.html`/`.meta`/`.rsc`), the old static
artifacts are silently left behind. Next.js's manifest-driven router won't
serve them, but they're still real files sitting in `.next/server/app/`, and
if any external cache (LiteSpeed's edge cache, on this host) ever cached a
response built from those stale files, it can keep serving that response
indefinitely — completely independent of what the currently-deployed code
does. This is exactly what happened with `/dashboard` in August 2026: a
proxy/auth fix was correctly deployed, but a LiteSpeed cache entry recorded
against an old static build kept bypassing it. Never merge a new `.next`
build on top of an old one — always replace it wholesale.

## Standard deployment sequence

1. **Validate locally, on a branch, before touching production:**
   ```
   npm run build
   npx tsc --noEmit
   npm run lint
   ```
   All three must be clean. Preserve: `next build --webpack` (Turbopack's
   native SWC binary needs a newer glibc than this host has — see `app.js`'s
   header comment), `dev: false` hardcoded in `app.js` (never derived from
   `NODE_ENV`), and the custom `app.js` Passenger entry point itself.

2. **Commit and push to `main` only once validated.** GitHub stays the
   source of truth; the server is a deployment target, never edited as the
   primary copy of anything except narrowly-scoped, immediately-committed
   hotfixes synced the same way this runbook describes.

3. **Stop the app** via cPanel → Setup Node.js App → Stop, for
   `dashboard.easylife.com.pk` only. Never stop or touch any other EasyLife
   application on this account.

4. **Remove the old `.next` production build directory entirely** before
   extracting the new one. (No SSH on this host — the practical path today
   is deleting `.next/` via cPanel File Manager's UI, since the Fileman UAPI
   exposes no delete/unlink function on this account tier — confirmed
   `delete_files`, `trash_files`, `unlink_files`, `rm_files` all return
   "function not found." `save_file_content` can zero out a specific file's
   *content* as a fallback, but that isn't a substitute for actually removing
   stale files from a route whose build output changed shape.)

5. **Extract the new, complete `.next` build** into a clean directory (no
   old build underneath it). Sync any other changed source files
   (`app.js`, `package.json`, `migrations/`, etc.) the same way.

6. **Verify `.next/BUILD_ID`** on the server matches the local build that
   was just validated — this confirms the right artifact landed, but by
   itself does *not* prove no stale files survived from a prior deploy if
   step 4 was skipped. Both checks matter.

7. **Start the app** via cPanel → Setup Node.js App → Start (a full
   Start/Stop cycle, not just touching `tmp/restart.txt` — a `restart.txt`
   touch only respawns an already-running Passenger process; it does not
   help if the app was fully stopped, and doesn't substitute for verifying
   the app actually comes back up clean).

8. **Health-test before declaring success:**
   - `GET /api/health` → `{"status":"ok","app":"ok","database":"ok"}`
   - `GET /`, `/login`, `/dashboard` (bare, no query string — this exact
     URL is what silently served stale cached content before), and at
     least one nested `/dashboard/*` route
   - Repeat the `/dashboard` check twice in a row to rule out a one-off
   - Tail `stderr.log` for anything new since the restart
   - If a route's caching behavior is in question, check response headers
     for `x-litespeed-cache`, `x-nextjs-cache`, and `cache-control` —
     a `s-maxage` in the years or an unexpected `HIT` on a route that
     should be dynamic is the signature of exactly this class of bug.

## Cache maintenance

`app.js` exposes a minimal, token-gated maintenance endpoint,
`GET /__cache-purge` (header `x-cache-purge-token: <CACHE_PURGE_TOKEN>`),
that purges exactly the `/dashboard` URL from LiteSpeed's edge cache via its
documented response-header purge API (`X-LiteSpeed-Purge: /dashboard`, a
bare path — not `url=`/`tag=`, which are different, unrelated directives).
It never accepts a caller-supplied path and cannot purge anything else. This
exists because the account has no self-service LiteSpeed cache-manager UI
and no SSH. A wrong/missing token returns a plain 404, not 403, so the
route's existence isn't confirmable by probing. `CACHE_PURGE_TOKEN` is a
dedicated secret, separate from `SETUP_TOKEN`/`AUTH_SECRET`, so it keeps
working after `SETUP_TOKEN` is removed post-bootstrap.
