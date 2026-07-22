import "../testSetup";
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import Fastify from "fastify";
import { eq } from "drizzle-orm";
import { ensureSchema, db } from "../db/client";
import { users, readingResults, quizInstances } from "../db/schema";
import { hashPassword } from "../auth/password";
import { signAccessToken } from "../auth/tokens";
import { registerCurriculumRoutes } from "./curriculum";

function buildApp() {
  const app = Fastify();
  registerCurriculumRoutes(app);
  return app;
}

async function createStudent(email: string) {
  const passwordHash = await hashPassword("studentpass123");
  const [student] = await db
    .insert(users)
    .values({ email, passwordHash, role: "student", displayName: "Stu" })
    .returning();
  return { student, token: signAccessToken({ sub: student.id, role: "student" }) };
}

function getCurriculum(app: ReturnType<typeof buildApp>, token: string) {
  return app.inject({ method: "GET", url: "/curriculum", headers: { authorization: `Bearer ${token}` } });
}

test("a fresh student sees the whole course with nothing completed", async () => {
  ensureSchema();
  const { token } = await createStudent("curric1@x.com");
  const app = buildApp();

  const res = await getCurriculum(app, token);
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.equal(body.completedLessons, 0);
  assert.ok(body.totalLessons > 0);
  assert.ok(body.units.length >= 5);
  // No placement yet -> start at the first unit.
  assert.equal(body.recommendedUnitId, "unit-a1");
  assert.equal(body.placementLevel, null);
});

test("finishing activities in their own modules marks the matching lessons complete", async () => {
  ensureSchema();
  const { student, token } = await createStudent("curric2@x.com");
  const app = buildApp();

  // Complete the A1 reading passage and a grammar quiz through the normal tables.
  await db.insert(readingResults).values({
    studentId: student.id,
    passageId: "a-day-at-the-park",
    score: 80,
    correctCount: 4,
    totalQuestions: 5,
  });
  await db.insert(quizInstances).values({
    id: randomUUID(),
    studentId: student.id,
    category: "grammar",
    difficultyLevel: "A1",
    questionsJson: "[]",
    score: 90,
  });

  const body = (await getCurriculum(app, token)).json();
  const a1 = body.units.find((u: { id: string }) => u.id === "unit-a1");
  const reading = a1.lessons.find((l: { type: string }) => l.type === "reading");
  const quiz = a1.lessons.find((l: { type: string }) => l.type === "quiz");
  assert.equal(reading.completed, true);
  assert.equal(quiz.completed, true);
  assert.equal(a1.completedCount, 2);
  assert.ok(body.completedLessons >= 2);
});

test("an ungraded quiz does not count as completion", async () => {
  ensureSchema();
  const { student, token } = await createStudent("curric3@x.com");
  const app = buildApp();

  await db.insert(quizInstances).values({
    id: randomUUID(),
    studentId: student.id,
    category: "grammar",
    difficultyLevel: "A1",
    questionsJson: "[]",
    // score left null -> not yet submitted/graded
  });

  const body = (await getCurriculum(app, token)).json();
  assert.equal(body.completedLessons, 0);
});

test("the placement level seeds the recommended unit", async () => {
  ensureSchema();
  const { student, token } = await createStudent("curric4@x.com");
  const app = buildApp();
  await db.update(users).set({ placementLevel: "B1" }).where(eq(users.id, student.id));

  const body = (await getCurriculum(app, token)).json();
  assert.equal(body.placementLevel, "B1");
  assert.equal(body.recommendedUnitId, "unit-b1");
});
