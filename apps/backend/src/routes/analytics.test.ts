import "../testSetup";
import { test } from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";
import { ensureSchema, db } from "../db/client";
import { classes, classStudents, conversations, users } from "../db/schema";
import { hashPassword } from "../auth/password";
import { signAccessToken } from "../auth/tokens";
import { registerAnalyticsRoutes } from "./analytics";

function buildApp() {
  const app = Fastify();
  registerAnalyticsRoutes(app);
  return app;
}

test("a student can view their own analytics via /analytics/me", async () => {
  ensureSchema();
  const passwordHash = await hashPassword("studentpass123");
  const [student] = await db
    .insert(users)
    .values({ email: "selfstu@x.com", passwordHash, role: "student", displayName: "Self" })
    .returning();
  await db.insert(conversations).values({ studentId: student.id, scenario: "daily" });

  const app = buildApp();
  const token = signAccessToken({ sub: student.id, role: "student" });

  const res = await app.inject({
    method: "GET",
    url: "/analytics/me",
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json().totalConversations, 1);
});

test("a teacher can view analytics for their own student, but not another teacher's student", async () => {
  ensureSchema();
  const passwordHash = await hashPassword("teacherpass123");
  const [teacherA] = await db
    .insert(users)
    .values({ email: "atc@x.com", passwordHash, role: "teacher", displayName: "Teacher A" })
    .returning();
  const [teacherB] = await db
    .insert(users)
    .values({ email: "btc@x.com", passwordHash, role: "teacher", displayName: "Teacher B" })
    .returning();
  const [cls] = await db
    .insert(classes)
    .values({ name: "Class", teacherId: teacherA.id })
    .returning();
  const [student] = await db
    .insert(users)
    .values({ email: "ownedstu@x.com", passwordHash, role: "student", displayName: "Owned" })
    .returning();
  await db.insert(classStudents).values({ classId: cls.id, studentId: student.id });

  const app = buildApp();
  const tokenA = signAccessToken({ sub: teacherA.id, role: "teacher" });
  const tokenB = signAccessToken({ sub: teacherB.id, role: "teacher" });

  const ownRes = await app.inject({
    method: "GET",
    url: `/analytics/students/${student.id}`,
    headers: { authorization: `Bearer ${tokenA}` },
  });
  assert.equal(ownRes.statusCode, 200);
  assert.equal(ownRes.json().displayName, "Owned");

  const deniedRes = await app.inject({
    method: "GET",
    url: `/analytics/students/${student.id}`,
    headers: { authorization: `Bearer ${tokenB}` },
  });
  assert.equal(deniedRes.statusCode, 404);
});

test("a student cannot call the teacher drilldown route", async () => {
  ensureSchema();
  const passwordHash = await hashPassword("studentpass123");
  const [student] = await db
    .insert(users)
    .values({ email: "notateacher@x.com", passwordHash, role: "student", displayName: "Stu" })
    .returning();

  const app = buildApp();
  const token = signAccessToken({ sub: student.id, role: "student" });

  const res = await app.inject({
    method: "GET",
    url: `/analytics/students/${student.id}`,
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(res.statusCode, 403);
});
