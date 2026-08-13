/**
 * Production entry point for cPanel / CloudLinux Node.js App (Phusion
 * Passenger). This is the file cPanel's "Application startup file" setting
 * points to - Passenger runs `node app.js` directly and expects it to bind
 * to the port Passenger assigns via `process.env.PORT`.
 *
 * This is plain CommonJS on purpose: cPanel/Passenger runs this file
 * directly with Node, with no TypeScript/bundler step in front of it, so it
 * must be valid, dependency-light JS on its own. It does the same thing
 * `next start` does - boot the standard Next.js production request handler
 * - just via the programmatic Custom Server API instead of the Next CLI,
 * because Passenger needs an `app.js` it can `require`/execute directly
 * rather than a CLI command.
 *
 * This file assumes a completed `next build` (a `.next/` production build)
 * already exists in this directory - it does not build the app itself.
 *
 * `turbopack: false` is required here: Turbopack needs a platform-specific
 * native binary, and shared hosts with an older glibc than the binary
 * requires can't load it - Next falls back to WASM bindings, which
 * explicitly don't support Turbopack and crash on `prepare()`. The build
 * itself also runs with `next build --webpack` (see package.json) to match.
 *
 * `dev` is hardcoded false, not derived from NODE_ENV: this file has
 * exactly one job - serve the pre-built `.next` in production - so it must
 * never silently fall into dev mode (which needs a working bundler at
 * request time) just because a host's stored NODE_ENV value isn't the
 * exact string "production" (e.g. a differently-cased value from a
 * hosting panel's own env var UI).
 *
 * Plain ASCII only in this file's comments: cPanel's Fileman UAPI has been
 * observed to mis-decode non-ASCII bytes (e.g. em dashes) on save, so
 * anything synced here directly (not via a build artifact) stays ASCII-safe.
 */

const { createServer } = require("node:http");
const next = require("next");

const dev = false;
const port = parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOSTNAME || undefined; // undefined = bind all interfaces, matches typical Passenger setups

console.log(`> Booting with NODE_ENV=${JSON.stringify(process.env.NODE_ENV)} PORT=${port}`);

const app = next({ dev, dir: __dirname, hostname, port, turbopack: false });
const handleRequest = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = createServer((req, res) => {
      // Cache-maintenance escape hatch: this host's cPanel account has no
      // self-service LiteSpeed cache-manager UI and no SSH access, so this
      // is the only way to evict a stale LiteSpeed-cached response for
      // /dashboard (e.g. one recorded from a build predating a proxy/auth
      // fix). It purges exactly one hardcoded URL via LiteSpeed's documented
      // response-header purge API - it never accepts a caller-supplied path,
      // so it cannot be used to purge anything else, on this domain or any
      // other. Gated by its own dedicated CACHE_PURGE_TOKEN (never reused
      // from SETUP_TOKEN/AUTH_SECRET) supplied only via a request header,
      // never a URL query string. A missing/wrong token gets a plain 404,
      // not a 403, so the route's existence isn't confirmable by probing.
      if (req.url === "/__cache-purge") {
        const expected = process.env.CACHE_PURGE_TOKEN;
        const provided = req.headers["x-cache-purge-token"];
        if (expected && provided === expected) {
          res.setHeader("X-LiteSpeed-Purge", "url=/dashboard");
          res.statusCode = 200;
          res.end("purged");
        } else {
          res.statusCode = 404;
          res.end("Not Found");
        }
        return;
      }

      handleRequest(req, res).catch((error) => {
        // Never leak stack traces/secrets to the client in production.
        console.error("Unhandled request error:", error);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.end("Internal Server Error");
        }
      });
    });

    server.listen(port, hostname, () => {
      console.log(`> EasyLife dashboard listening on port ${port} (${dev ? "development" : "production"})`);
    });

    // Let in-flight requests finish before exiting, per Next.js's
    // self-hosting guidance for graceful shutdowns.
    function shutdown(signal) {
      console.log(`> Received ${signal}, shutting down gracefully...`);
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(1), 25000).unref();
    }
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  })
  .catch((error) => {
    console.error("Failed to start the EasyLife dashboard server:", error);
    process.exit(1);
  });

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});
