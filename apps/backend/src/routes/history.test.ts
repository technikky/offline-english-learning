import "../testSetup";
import { test } from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";
import { ensureSchema, db } from "../db/client";
import { users, conversations, readingResults, quizInstances } from "../db/schema";
import { hashPassword } from "../auth/password";
import { signAccessToken } from "../auth/tokens";
import { registerHistoryRoutes } from "./history";

function buildApp() {
  const app = Fastify();
  registerHistoryRoutes(app);
  return app;
}

async function createStudent(email: string) {
  const passwordHash = await hashPassword("studentpass123");
  const [student] = await db
    .insert(users)
    .values({ email, passwordHash, role: "student", displayName: "Stu" })
    .returning();
  return { id: student.id, token: signAccessToken({ sub: student.id, role: "student" }) };
}

test("returns an empty history for a new student", async () => {
  ensureSchema();
  const { token } = await createStudent("hist-empty@x.com");
  const app = buildApp();
  const res = await app.inject({ method: "GET", url: "/history", headers: { authorization: `Bearer ${token}` } });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json(), { entries: [], totalActivities: 0, averageScore: 0 });
});

test("merges activities across modules, newest first, and computes the average score", async () => {
  ensureSchema();
  const { id, token } = await createStudent("hist-mixed@x.com");

  await db.insert(conversations).values({ studentId: id, scenario: "restaurant", createdAt: "2026-01-01 10:00:00" });
  await db.insert(readingResults).values({
    studentId: id, passageId: "a-day-at-the-park", score: 80, correctCount: 4, totalQuestions: 5, createdAt: "2026-01-02 10:00:00",
  });
  await db.insert(quizInstances).values({
    id: "quiz-1", studentId: id, category: "grammar", difficultyLevel: "A2",
    questionsJson: "[]", score: 60, createdAt: "2026-01-03 10:00:00",
  });
  // An ungraded quiz should not appear in history.
  await db.insert(quizInstances).values({
    id: "quiz-2", studentId: id, category: "vocabulary", difficultyLevel: "A2",
    questionsJson: "[]", score: null, createdAt: "2026-01-04 10:00:00",
  });

  const app = buildApp();
  const res = await app.inject({ method: "GET", url: "/history", headers: { authorization: `Bearer ${token}` } });
  assert.equal(res.statusCode, 200);
  const body = res.json();

  assert.equal(body.totalActivities, 3, "ungraded quiz excluded");
  // Newest first: quiz (Jan 3) > reading (Jan 2) > conversation (Jan 1).
  assert.equal(body.entries[0].type, "quiz");
  assert.equal(body.entries[1].type, "reading");
  assert.equal(body.entries[2].type, "conversation");
  assert.ok(body.entries[1].title.includes("A Day at the Park"));
  // Average over scored entries only (quiz 60, reading 80; conversation has no score).
  assert.equal(body.averageScore, 70);
});

test("only returns the requesting student's own history", async () => {
  ensureSchema();
  const a = await createStudent("hist-a@x.com");
  const b = await createStudent("hist-b@x.com");
  await db.insert(conversations).values({ studentId: a.id, scenario: "travel" });

  const app = buildApp();
  const resB = await app.inject({ method: "GET", url: "/history", headers: { authorization: `Bearer ${b.token}` } });
  assert.equal(resB.json().totalActivities, 0, "student B should not see student A's activity");
});

test("requires authentication", async () => {
  ensureSchema();
  const app = buildApp();
  const res = await app.inject({ method: "GET", url: "/history" });
  assert.equal(res.statusCode, 401);
});
