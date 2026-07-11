import "../testSetup";
import { test } from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";
import { ensureSchema, db } from "../db/client";
import { classes, classStudents, conversations, users } from "../db/schema";
import { hashPassword } from "../auth/password";
import { signAccessToken } from "../auth/tokens";
import { registerAssignmentRoutes } from "./assignments";

function buildApp() {
  const app = Fastify();
  registerAssignmentRoutes(app);
  return app;
}

async function setupClassWithStudents(suffix: string) {
  const passwordHash = await hashPassword("teacherpass123");
  const [teacher] = await db
    .insert(users)
    .values({
      email: `asgteach-${suffix}@x.com`,
      passwordHash,
      role: "teacher",
      displayName: "Teacher",
    })
    .returning();
  const [cls] = await db
    .insert(classes)
    .values({ name: "Class", teacherId: teacher.id })
    .returning();
  const [studentDone] = await db
    .insert(users)
    .values({
      email: `done-${suffix}@x.com`,
      passwordHash,
      role: "student",
      displayName: "Done Student",
    })
    .returning();
  const [studentPending] = await db
    .insert(users)
    .values({
      email: `pending-${suffix}@x.com`,
      passwordHash,
      role: "student",
      displayName: "Pending Student",
    })
    .returning();
  await db.insert(classStudents).values([
    { classId: cls.id, studentId: studentDone.id },
    { classId: cls.id, studentId: studentPending.id },
  ]);
  return { teacher, cls, studentDone, studentPending };
}

test("creates an assignment and reports per-student completion based on matching conversations", async () => {
  ensureSchema();
  const { teacher, cls, studentDone } = await setupClassWithStudents("completion");

  const app = buildApp();
  const token = signAccessToken({ sub: teacher.id, role: "teacher" });

  const created = await app.inject({
    method: "POST",
    url: `/teacher/classes/${cls.id}/assignments`,
    headers: { authorization: `Bearer ${token}` },
    payload: {
      title: "Practice daily talk",
      description: "Have a conversation",
      scenario: "daily",
      dueDate: "2026-08-01",
    },
  });
  assert.equal(created.statusCode, 201);

  // Simulate the "done" student completing it after the assignment was created.
  await db.insert(conversations).values({
    studentId: studentDone.id,
    scenario: "daily",
    createdAt: new Date(Date.now() + 1000).toISOString(),
  });

  const list = await app.inject({
    method: "GET",
    url: `/teacher/classes/${cls.id}/assignments`,
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(list.statusCode, 200);
  const [assignment] = list.json();

  const doneEntry = assignment.completion.find((c: any) => c.displayName === "Done Student");
  const pendingEntry = assignment.completion.find(
    (c: any) => c.displayName === "Pending Student",
  );
  assert.equal(doneEntry.completed, true);
  assert.equal(pendingEntry.completed, false);
});

test("rejects an invalid scenario when creating an assignment", async () => {
  ensureSchema();
  const { teacher, cls } = await setupClassWithStudents("invalid-scenario");
  const app = buildApp();
  const token = signAccessToken({ sub: teacher.id, role: "teacher" });

  const res = await app.inject({
    method: "POST",
    url: `/teacher/classes/${cls.id}/assignments`,
    headers: { authorization: `Bearer ${token}` },
    payload: {
      title: "Bad assignment",
      description: "d",
      scenario: "not-a-scenario",
      dueDate: "2026-08-01",
    },
  });
  assert.equal(res.statusCode, 400);
});
