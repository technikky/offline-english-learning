import { db } from "../db/client";
import { auditLogs } from "../db/schema";

export interface AuditEventInput {
  userId: number | null;
  action: string;
  detail: string | null;
  ipAddress: string | null;
}

// Security-relevant events only (auth + admin actions) — the full request
// log already goes to stdout via Fastify's own `logger: true`.
export async function recordAuditEvent(event: AuditEventInput): Promise<void> {
  await db.insert(auditLogs).values({
    userId: event.userId,
    action: event.action,
    detail: event.detail,
    ipAddress: event.ipAddress,
  });
}
