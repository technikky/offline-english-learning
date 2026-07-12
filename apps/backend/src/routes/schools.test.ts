import "../testSetup";
import { test } from "node:test";
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import Fastify from "fastify";
import { ensureSchema, db } from "../db/client";
import { schools, users } from "../db/schema";
import { hashPassword } from "../auth/password";
import { signAccessToken } from "../auth/tokens";
import { registerSchoolRoutes } from "./schools";
import { registerAdminRoutes } from "./admin";

function buildApp() {
  const app = Fastify();
  registerSchoolRoutes(app);
  registerAdminRoutes(app);
  return app;
}

async function createSuperAdmin(email: string) {
  const passwordHash = await hashPassword("superpass123");
  const [sa] = await db
    .insert(users)
    .values({ email, passwordHash, role: "super_admin", displayName: "SA", schoolId: null })
    .returning();
  return signAccessToken({ sub: sa.id, role: "super_admin" });
}

test("super_admin can create a school, list it, and add a school admin", async () => {
  ensureSchema();
  const token = await createSuperAdmin("sa1@x.com");
  const app = buildApp();

  const created = await app.inject({
    method: "POST",
    url: "/schools",
    headers: { authorization: `Bearer ${token}` },
    payload: { name: "Riverside High" },
  });
  assert.equal(created.statusCode, 201);
  const school = created.json();
  assert.equal(school.name, "Riverside High");
  assert.equal(school.adminCount, 0);

  const adminRes = await app.inject({
    method: "POST",
    url: `/schools/${school.id}/admins`,
    headers: { authorization: `Bearer ${token}` },
    payload: { email: "principal@riverside.local", password: "riverside123", displayName: "Principal" },
  });
  assert.equal(adminRes.statusCode, 201);
  const adminProfile = adminRes.json();
  assert.equal(adminProfile.role, "admin");
  assert.equal(adminProfile.schoolId, school.id);
  assert.equal(adminProfile.schoolName, "Riverside High");

  const list = await app.inject({ method: "GET", url: "/schools", headers: { authorization: `Bearer ${token}` } });
  const schoolsList = list.json();
  const found = schoolsList.find((s: { id: number }) => s.id === school.id);
  assert.equal(found.adminCount, 1);
});

test("creating a school admin for an unknown school returns 404", async () => {
  ensureSchema();
  const token = await createSuperAdmin("sa2@x.com");
  const app = buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/schools/9999/admins",
    headers: { authorization: `Bearer ${token}` },
    payload: { email: "x@x.com", password: "password123", displayName: "X" },
  });
  assert.equal(res.statusCode, 404);
});

test("a teacher/student created by a school admin inherits the admin's school (tenant isolation)", async () => {
  ensureSchema();
  const token = await createSuperAdmin("sa3@x.com");
  const app = buildApp();

  // Create two schools, each with its own admin.
  const schoolA = (await app.inject({ method: "POST", url: "/schools", headers: { authorization: `Bearer ${token}` }, payload: { name: "School A" } })).json();
  const schoolB = (await app.inject({ method: "POST", url: "/schools", headers: { authorization: `Bearer ${token}` }, payload: { name: "School B" } })).json();

  await app.inject({ method: "POST", url: `/schools/${schoolA.id}/admins`, headers: { authorization: `Bearer ${token}` }, payload: { email: "adminA@x.com", password: "password123", displayName: "Admin A" } });

  const adminA = await db.query.users.findFirst({ where: eq(users.email, "adminA@x.com") });
  const adminAToken = signAccessToken({ sub: adminA!.id, role: "admin" });

  // Admin A creates a teacher -> should land in School A, not School B.
  const teacherRes = await app.inject({
    method: "POST",
    url: "/admin/users",
    headers: { authorization: `Bearer ${adminAToken}` },
    payload: { email: "teacherA@x.com", password: "password123", displayName: "Teacher A", role: "teacher" },
  });
  assert.equal(teacherRes.statusCode, 201);
  assert.equal(teacherRes.json().schoolId, schoolA.id);
  assert.notEqual(teacherRes.json().schoolId, schoolB.id);

  const created = await db.query.users.findFirst({ where: eq(users.email, "teacherA@x.com") });
  assert.equal(created!.schoolId, schoolA.id);

  void schools;
});

test("a non-super-admin cannot create a school", async () => {
  ensureSchema();
  const passwordHash = await hashPassword("adminpass123");
  const [admin] = await db
    .insert(users)
    .values({ email: "plainadmin@x.com", passwordHash, role: "admin", displayName: "A", schoolId: null })
    .returning();
  const app = buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/schools",
    headers: { authorization: `Bearer ${signAccessToken({ sub: admin.id, role: "admin" })}` },
    payload: { name: "Sneaky School" },
  });
  assert.equal(res.statusCode, 403);
});
