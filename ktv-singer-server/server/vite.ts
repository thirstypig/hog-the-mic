/**
 * Server utilities.
 *
 * The web client has been removed — the server is now a pure JSON API
 * consumed by the React Native mobile app.  This file retains the
 * `log` helper and stubs out `setupVite` / `serveStatic` so that
 * the existing bootstrap code in index.ts keeps working without changes.
 */

import type { Express } from "express";
import type { Server } from "http";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(_app: Express, _server: Server) {
  // No-op: web client has been removed.
  // The server now runs as a standalone API.
  log("Running as API-only server (no web client)");
}

export function serveStatic(_app: Express) {
  // No-op: web client has been removed.
}
