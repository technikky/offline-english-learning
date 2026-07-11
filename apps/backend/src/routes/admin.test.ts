import "../testSetup";
import { test } from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";
import { ensureSchema, db } from "../db/client";
import { users } from "../db/schema";
import { hashPassword } from "../auth/password";
import { signAccessToken } from "../auth/tokens";
import { registerAdminRoutes } from "./admin";

function buildApp() {
  const app = Fastify();
  registerAdminRoutes(app);
  return app;
}

test("admin can create a teacher account; a student calling the same route is rejected", async () => {
  ensureSchema();
  const passwordHash = await hashPassword("adminpass123");
  const [admin] = await db
    .insert(users)
    .values({ email: "admin@x.com", passwordHash, role: "admin", displayName: "Admin" })
    .returning();
  const [student] = await db
    .insert(users)
    .values({ email: "student@x.com", passwordHash, role: "student", displayName: "Stu" })
    .returning();

  const app = buildApp();
  const adminToken = signAccessToken({ sub: admin.id, role: "admin" });
  const studentToken = signAccessToken({ sub: student.id, role: "student" });

  const created = await app.inject({
    method: "POST",
    url: "/admin/users",
    headers: { authorization: `Bearer ${adminToken}` },
    payload: {
      email: "teacher@x.com",
      password: "teacherpass123",
      displayName: "Ms Teacher",
      role: "teacher",
    },
  });
  assert.equal(created.statusCode, 201);
  assert.equal(created.json().role, "teacher");

  const denied = await app.inject({
    method: "POST",
    url: "/admin/users",
    headers: { authorization: `Bearer ${studentToken}` },
    payload: {
      email: "hacker@x.com",
      password: "whatever123",
      displayName: "Nope",
      role: "teacher",
    },
  });
  assert.equal(denied.statusCode, 403);
});
