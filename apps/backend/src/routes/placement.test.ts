import "../testSetup";
import { test } from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";
import { ensureSchema, db } from "../db/client";
import { users } from "../db/schema";
import { hashPassword } from "../auth/password";
import { signAccessToken } from "../auth/tokens";
import { getItemById } from "../placement/items";
import { registerPlacementRoutes } from "./placement";

function buildApp() {
  const app = Fastify();
  registerPlacementRoutes(app);
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

function answersFor(block: { items: { id: string }[] }, mode: "correct" | "wrong") {
  const answers: Record<string, string> = {};
  for (const item of block.items) {
    const full = getItemById(item.id)!;
    answers[item.id] = mode === "correct" ? full.correctAnswer : "___definitely-wrong___";
  }
  return answers;
}

// Drives a whole test to completion, answering every block the same way.
async function runToCompletion(app: ReturnType<typeof buildApp>, token: string, mode: "correct" | "wrong") {
  const started = await app.inject({
    method: "POST",
    url: "/placement/start",
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(started.statusCode, 200);
  let block = started.json();
  assert.equal(block.level, "B1"); // always starts mid-scale

  // Safety bound: the staircase can't exceed the number of CEFR rungs.
  for (let i = 0; i < 8; i++) {
    const res = await app.inject({
      method: "POST",
      url: `/placement/${block.sessionId}/answer`,
      headers: { authorization: `Bearer ${token}` },
      payload: { answers: answersFor(block, mode) },
    });
    assert.equal(res.statusCode, 200);
    const body = res.json();
    if (body.complete) return body.resultLevel;
    block = body.block;
  }
  throw new Error("placement test did not converge");
}

test("a student who answers everything correctly is placed at C2", async () => {
  ensureSchema();
  const { student, token } = await createStudent("placetop@x.com");
  const app = buildApp();

  const resultLevel = await runToCompletion(app, token, "correct");
  assert.equal(resultLevel, "C2");

  const status = await app.inject({
    method: "GET",
    url: "/placement/status",
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(status.json().placementLevel, "C2");
  assert.ok(status.json().completedAt);

  const saved = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, student.id) });
  assert.equal(saved?.placementLevel, "C2");
});

test("a student who answers everything wrong is placed at A1", async () => {
  ensureSchema();
  const { token } = await createStudent("placefloor@x.com");
  const app = buildApp();
  const resultLevel = await runToCompletion(app, token, "wrong");
  assert.equal(resultLevel, "A1");
});

test("passing B1 then failing B2 places the student at B1", async () => {
  ensureSchema();
  const { token } = await createStudent("placemid@x.com");
  const app = buildApp();

  const started = await app.inject({
    method: "POST",
    url: "/placement/start",
    headers: { authorization: `Bearer ${token}` },
  });
  const b1 = started.json();
  assert.equal(b1.level, "B1");

  const afterB1 = await app.inject({
    method: "POST",
    url: `/placement/${b1.sessionId}/answer`,
    headers: { authorization: `Bearer ${token}` },
    payload: { answers: answersFor(b1, "correct") },
  });
  const b2 = afterB1.json().block;
  assert.equal(afterB1.json().complete, false);
  assert.equal(b2.level, "B2");

  const afterB2 = await app.inject({
    method: "POST",
    url: `/placement/${b2.sessionId}/answer`,
    headers: { authorization: `Bearer ${token}` },
    payload: { answers: answersFor(b2, "wrong") },
  });
  assert.equal(afterB2.json().complete, true);
  assert.equal(afterB2.json().resultLevel, "B1");
});

test("status is null before the test is taken", async () => {
  ensureSchema();
  const { token } = await createStudent("placenone@x.com");
  const app = buildApp();
  const status = await app.inject({
    method: "GET",
    url: "/placement/status",
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(status.json().placementLevel, null);
  assert.equal(status.json().completedAt, null);
});

test("answering a bogus session id returns 404", async () => {
  ensureSchema();
  const { token } = await createStudent("placebogus@x.com");
  const app = buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/placement/does-not-exist/answer",
    headers: { authorization: `Bearer ${token}` },
    payload: { answers: {} },
  });
  assert.equal(res.statusCode, 404);
});
