import type { FastifyInstance } from "fastify";
import type { HealthResponse } from "@englishclass/types";
import { db } from "../db/client";
import { sql } from "drizzle-orm";

export function registerHealthRoute(app: FastifyInstance): void {
  app.get("/health", async (): Promise<HealthResponse> => {
    let dbConnected = false;
    try {
      db.get(sql`SELECT 1`);
      dbConnected = true;
    } catch {
      dbConnected = false;
    }

    return {
      status: "ok",
      dbConnected,
      timestamp: new Date().toISOString(),
    };
  });
}
