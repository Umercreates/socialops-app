/**
 * Production entry point for cPanel / CloudLinux Node.js App (Phusion
 * Passenger). This is the file cPanel's "Application startup file" setting
 * points to — Passenger runs `node app.js` directly and expects it to bind
 * to the port Passenger assigns via `process.env.PORT`.
 *
 * This is plain CommonJS on purpose: cPanel/Passenger runs this file
 * directly with Node, with no TypeScript/bundler step in front of it, so it
 * must be valid, dependency-light JS on its own. It does the same thing
 * `next start` does — boot the standard Next.js production request handler
 * — just via the programmatic Custom Server API instead of the Next CLI,
 * because Passenger needs an `app.js` it can `require`/execute directly
 * rather than a CLI command.
 *
 * This file assumes a completed `next build` (a `.next/` production build)
 * already exists in this directory — it does not build the app itself.
 */

const { createServer } = require("node:http");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOSTNAME || undefined; // undefined = bind all interfaces, matches typical Passenger setups

const app = next({ dev, dir: __dirname, hostname, port });
const handleRequest = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = createServer((req, res) => {
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
