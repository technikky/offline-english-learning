import "../testSetup";
import { test } from "node:test";
import assert from "node:assert/strict";
import Fastify, { type FastifyInstance } from "fastify";
import { ensureSchema, db } from "../db/client";
import { users } from "../db/schema";
import { hashPassword } from "../auth/password";
import { signAccessToken } from "../auth/tokens";
import { registerAdminRoutes } from "../routes/admin";
import { registerTeacherRoutes } from "../routes/teacher";
import { registerAssignmentRoutes } from "../routes/assignments";
import { registerTeacherReviewRoutes } from "../routes/teacherReview";
import { registerReportRoutes } from "../routes/reports";
import { registerAnalyticsRoutes } from "../routes/analytics";
import { registerSchoolRoutes } from "../routes/schools";

// Systematic sweep of every route protected by requireRole(): each must
// reject an unauthenticated caller (401) and a caller with the wrong role
// (403). This is the "RBAC penetration pass" required by Stage 11 — the
// happy path (correct role succeeds) is already covered by each route's own
// existing test file, so this suite only re-asserts the negative space.
const protectedRoutes: {
  method: "GET" | "POST";
  url: string;
  allowedRole: "super_admin" | "admin" | "teacher";
}[] = [
  { method: "GET", url: "/schools", allowedRole: "super_admin" },
  { method: "POST", url: "/schools", allowedRole: "super_admin" },
  { method: "POST", url: "/schools/1/admins", allowedRole: "super_admin" },
  { method: "POST", url: "/admin/users", allowedRole: "admin" },
  { method: "POST", url: "/admin/backups", allowedRole: "admin" },
  { method: "GET", url: "/admin/backups", allowedRole: "admin" },
  { method: "POST", url: "/admin/backups/whatever.db/restore", allowedRole: "admin" },
  { method: "GET", url: "/admin/system-health", allowedRole: "admin" },
  { method: "GET", url: "/admin/config", allowedRole: "admin" },
  { method: "GET", url: "/admin/ai-models", allowedRole: "admin" },
  { method: "POST", url: "/admin/ai-models/select", allowedRole: "admin" },
  { method: "GET", url: "/teacher/classes", allowedRole: "teacher" },
  { method: "GET", url: "/teacher/classes/1", allowedRole: "teacher" },
  { method: "POST", url: "/teacher/classes", allowedRole: "teacher" },
  { method: "POST", url: "/teacher/classes/1/students", allowedRole: "teacher" },
  { method: "POST", url: "/teacher/classes/1/assignments", allowedRole: "teacher" },
  { method: "GET", url: "/teacher/classes/1/assignments", allowedRole: "teacher" },
  { method: "GET", url: "/teacher/classes/1/report.csv", allowedRole: "teacher" },
  { method: "GET", url: "/teacher/classes/1/report.pdf", allowedRole: "teacher" },
  { method: "GET", url: "/teacher/classes/1/mistakes", allowedRole: "teacher" },
  { method: "GET", url: "/analytics/students/1", allowedRole: "teacher" },
];

function buildApp(): FastifyInstance {
  const app = Fastify();
  registerAdminRoutes(app);
  registerTeacherRoutes(app);
  registerAssignmentRoutes(app);
  registerTeacherReviewRoutes(app);
  registerReportRoutes(app);
  registerAnalyticsRoutes(app);
  registerSchoolRoutes(app);
  return app;
}

test("RBAC penetration sweep: every protected route rejects unauthenticated and wrong-role callers", async () => {
  ensureSchema();
  const passwordHash = await hashPassword("pentestpass123");
  const [admin] = await db
    .insert(users)
    .values({ email: "pentest-admin@x.com", passwordHash, role: "admin", displayName: "A" })
    .returning();
  const [teacher] = await db
    .insert(users)
    .values({ email: "pentest-teacher@x.com", passwordHash, role: "teacher", displayName: "T" })
    .returning();
  const [student] = await db
    .insert(users)
    .values({ email: "pentest-student@x.com", passwordHash, role: "student", displayName: "S" })
    .returning();
  const [superAdmin] = await db
    .insert(users)
    .values({ email: "pentest-super@x.com", passwordHash, role: "super_admin", displayName: "SA" })
    .returning();

  const tokensByRole = {
    super_admin: signAccessToken({ sub: superAdmin.id, role: "super_admin" }),
    admin: signAccessToken({ sub: admin.id, role: "admin" }),
    teacher: signAccessToken({ sub: teacher.id, role: "teacher" }),
    student: signAccessToken({ sub: student.id, role: "student" }),
  };

  const app = buildApp();

  for (const route of protectedRoutes) {
    const unauthenticated = await app.inject({ method: route.method, url: route.url });
    assert.equal(
      unauthenticated.statusCode,
      401,
      `${route.method} ${route.url} should reject a missing token with 401`,
    );

    const wrongRoles = (["super_admin", "admin", "teacher", "student"] as const).filter(
      (role) => role !== route.allowedRole,
    );
    for (const wrongRole of wrongRoles) {
      const denied = await app.inject({
        method: route.method,
        url: route.url,
        headers: { authorization: `Bearer ${tokensByRole[wrongRole]}` },
      });
      assert.equal(
        denied.statusCode,
        403,
        `${route.method} ${route.url} should reject role '${wrongRole}' with 403`,
      );
    }
  }
});
