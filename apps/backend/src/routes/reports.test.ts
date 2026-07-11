import "../testSetup";
import { test } from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";
import { ensureSchema, db } from "../db/client";
import { classes, classStudents, conversations, users } from "../db/schema";
import { hashPassword } from "../auth/password";
import { signAccessToken } from "../auth/tokens";
import { registerReportRoutes } from "./reports";

function buildApp() {
  const app = Fastify();
  registerReportRoutes(app);
  return app;
}

test("CSV report includes a header and one row per student with stats", async () => {
  ensureSchema();
  const passwordHash = await hashPassword("teacherpass123");
  const [teacher] = await db
    .insert(users)
    .values({ email: "reportteach@x.com", passwordHash, role: "teacher", displayName: "Teach" })
    .returning();
  const [cls] = await db
    .insert(classes)
    .values({ name: "Report Class", teacherId: teacher.id })
    .returning();
  const [student] = await db
    .insert(users)
    .values({ email: "reportstu@x.com", passwordHash, role: "student", displayName: "Rex" })
    .returning();
  await db.insert(classStudents).values({ classId: cls.id, studentId: student.id });
  await db.insert(conversations).values({ studentId: student.id, scenario: "daily" });

  const app = buildApp();
  const token = signAccessToken({ sub: teacher.id, role: "teacher" });

  const res = await app.inject({
    method: "GET",
    url: `/teacher/classes/${cls.id}/report.csv`,
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(res.statusCode, 200);
  assert.match(res.headers["content-type"] as string, /text\/csv/);

  const lines = res.body.trim().split("\n");
  assert.equal(lines.length, 2);
  assert.equal(
    lines[0],
    "Student Name,Email,Conversations,Grammar Mistakes,Vocabulary Words,Estimated Level",
  );
  assert.match(lines[1], /^Rex,reportstu@x\.com,1,0,0,/);
});

test("a teacher cannot download another teacher's class report", async () => {
  ensureSchema();
  const passwordHash = await hashPassword("teacherpass123");
  const [teacherA] = await db
    .insert(users)
    .values({ email: "reporta@x.com", passwordHash, role: "teacher", displayName: "A" })
    .returning();
  const [teacherB] = await db
    .insert(users)
    .values({ email: "reportb@x.com", passwordHash, role: "teacher", displayName: "B" })
    .returning();
  const [cls] = await db
    .insert(classes)
    .values({ name: "Class", teacherId: teacherA.id })
    .returning();

  const app = buildApp();
  const tokenB = signAccessToken({ sub: teacherB.id, role: "teacher" });

  const res = await app.inject({
    method: "GET",
    url: `/teacher/classes/${cls.id}/report.csv`,
    headers: { authorization: `Bearer ${tokenB}` },
  });
  assert.equal(res.statusCode, 404);
});
