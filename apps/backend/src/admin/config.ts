import type { ServerConfigResponse } from "@englishclass/types";
import { dbPath } from "../db/client";

// Read-only view of the running server's configuration for the admin
// dashboard. Deliberately excludes anything secret (JWT secret, TLS key
// path) -- see docs/15-stage12-plan.md for why this stays read-only rather
// than becoming an editable settings form.
export function getServerConfig(): ServerConfigResponse {
  return {
    port: Number(process.env.PORT ?? 4310),
    host: process.env.HOST ?? "127.0.0.1",
    tlsEnabled: process.env.TLS_ENABLED === "true",
    rateLimitPerMinute: 10,
    dbPath,
  };
}
