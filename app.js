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
const fs = require("node:fs");
const path = require("node:path");
const next = require("next");

const dev = false;
const port = parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOSTNAME || undefined; // undefined = bind all interfaces, matches typical Passenger setups

console.log(`> Booting with NODE_ENV=${JSON.stringify(process.env.NODE_ENV)} PORT=${port}`);

/**
 * cPanel's Fileman zip-extraction has been observed to leave some nested
 * directories under .next/static without execute/traverse permission,
 * which crashes Next's static-file scanner on startup (EACCES on scandir)
 * before it ever gets to serve a request. This walks .next/static once at
 * boot - and only that directory, nothing else in the deployment - and
 * normalizes modes before Next touches the filesystem, so a bad
 * extraction self-heals on the next restart instead of requiring a
 * manual, multi-round chmod-by-hand recovery. Runs as the same OS user
 * that owns these files (the cPanel account), so no elevated privilege
 * is needed - chmod only requires file ownership, not the file's current
 * permission bits.
 */
function repairStaticPermissions(staticDir) {
  const DIR_MODE = 0o755;
  const FILE_MODE = 0o644;
  let dirsFixed = 0;
  let filesFixed = 0;
  let failures = 0;

  function walk(currentDir) {
    let entries;
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch (error) {
      failures += 1;
      console.error(`> Permission repair: cannot read ${currentDir}: ${error.message}`);
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      let stat;
      try {
        stat = fs.lstatSync(fullPath); // lstat, never follow symlinks
      } catch (error) {
        failures += 1;
        console.error(`> Permission repair: cannot stat ${fullPath}: ${error.message}`);
        continue;
      }

      if (stat.isSymbolicLink()) continue;

      if (stat.isDirectory()) {
        try {
          if ((stat.mode & 0o777) !== DIR_MODE) {
            fs.chmodSync(fullPath, DIR_MODE);
            dirsFixed += 1;
          }
        } catch (error) {
          failures += 1;
          console.error(`> Permission repair: cannot chmod dir ${fullPath}: ${error.message}`);
          continue; // couldn't fix it - descending would just hit the same wall
        }
        walk(fullPath);
      } else if (stat.isFile()) {
        try {
          if ((stat.mode & 0o777) !== FILE_MODE) {
            fs.chmodSync(fullPath, FILE_MODE);
            filesFixed += 1;
          }
        } catch (error) {
          failures += 1;
          console.error(`> Permission repair: cannot chmod file ${fullPath}: ${error.message}`);
        }
      }
    }
  }

  if (!fs.existsSync(staticDir)) {
    console.log(`> Permission repair: ${staticDir} does not exist, skipping.`);
    return;
  }

  const startedAt = Date.now();
  walk(staticDir);
  console.log(
    `> Permission repair: normalized ${dirsFixed} dir(s), ${filesFixed} file(s), ${failures} failure(s) under ${staticDir} in ${Date.now() - startedAt}ms.`
  );
}

repairStaticPermissions(path.join(__dirname, ".next", "static"));

const app = next({ dev, dir: __dirname, hostname, port, turbopack: false });
const handleRequest = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = createServer((req, res) => {
      // Cache-maintenance escape hatch: this host's cPanel account has no
      // self-service LiteSpeed cache-manager UI and no SSH access, so this
      // is the only way to evict stale LiteSpeed-cached responses recorded
      // from a build predating a proxy/auth fix (e.g. /login was found
      // still serving demo-credentials hint text from before AUTH_MODE was
      // ever set to production). It purges only the fixed, hardcoded paths
      // listed below via LiteSpeed's documented response-header purge API -
      // it never accepts a caller-supplied path, so it cannot be used to
      // purge anything else, on this domain or any other. Gated by its own
      // dedicated CACHE_PURGE_TOKEN (never reused from SETUP_TOKEN/
      // AUTH_SECRET) supplied only via a request header, never a URL query
      // string. A missing/wrong token gets a plain 404, not a 403, so the
      // route's existence isn't confirmable by probing.
      const CACHE_PURGE_PATHS = ["/dashboard", "/login"];
      if (req.url === "/__cache-purge") {
        const expected = process.env.CACHE_PURGE_TOKEN;
        const provided = req.headers["x-cache-purge-token"];
        if (expected && provided === expected) {
          res.setHeader("X-LiteSpeed-Purge", CACHE_PURGE_PATHS.join(","));
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
