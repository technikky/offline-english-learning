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

test("admin can read server config", async () => {
  ensureSchema();
  const passwordHash = await hashPassword("adminpass123");
  const [admin] = await db
    .insert(users)
    .values({ email: "admin2@x.com", passwordHash, role: "admin", displayName: "Admin" })
    .returning();

  const app = buildApp();
  const adminToken = signAccessToken({ sub: admin.id, role: "admin" });

  const res = await app.inject({
    method: "GET",
    url: "/admin/config",
    headers: { authorization: `Bearer ${adminToken}` },
  });
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.equal(typeof body.port, "number");
  assert.equal(typeof body.tlsEnabled, "boolean");
});

test("admin can list vendored AI models", async () => {
  ensureSchema();
  const passwordHash = await hashPassword("adminpass123");
  const [admin] = await db
    .insert(users)
    .values({ email: "admin3@x.com", passwordHash, role: "admin", displayName: "Admin" })
    .returning();

  const app = buildApp();
  const adminToken = signAccessToken({ sub: admin.id, role: "admin" });

  const res = await app.inject({
    method: "GET",
    url: "/admin/ai-models",
    headers: { authorization: `Bearer ${adminToken}` },
  });
  assert.equal(res.statusCode, 200);
  assert.ok(Array.isArray(res.json()));
});

test("selecting a nonexistent AI model returns 404", async () => {
  ensureSchema();
  const passwordHash = await hashPassword("adminpass123");
  const [admin] = await db
    .insert(users)
    .values({ email: "admin4@x.com", passwordHash, role: "admin", displayName: "Admin" })
    .returning();

  const app = buildApp();
  const adminToken = signAccessToken({ sub: admin.id, role: "admin" });

  const res = await app.inject({
    method: "POST",
    url: "/admin/ai-models/select",
    headers: { authorization: `Bearer ${adminToken}` },
    payload: { filename: "does-not-exist.gguf" },
  });
  assert.equal(res.statusCode, 404);
});
