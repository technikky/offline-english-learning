import "../testSetup";
import { test } from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";
import { ensureSchema, db } from "../db/client";
import { users, schools } from "../db/schema";
import { hashPassword } from "../auth/password";
import { signAccessToken } from "../auth/tokens";
import { registerTopicRoutes } from "./topics";
import { registerConversationRoutes } from "./conversations";

function buildApp() {
  const app = Fastify();
  registerTopicRoutes(app);
  registerConversationRoutes(app);
  return app;
}

async function makeUser(email: string, role: "teacher" | "student", schoolId: number | null) {
  const passwordHash = await hashPassword("password123");
  const [u] = await db
    .insert(users)
    .values({ email, passwordHash, role, displayName: role, schoolId })
    .returning();
  return { id: u.id, token: signAccessToken({ sub: u.id, role }) };
}

test("a teacher can create a custom topic and it appears in a same-school student's topic list", async () => {
  ensureSchema();
  const [school] = await db.insert(schools).values({ name: "S" }).returning();
  const teacher = await makeUser("t-topic@x.com", "teacher", school.id);
  const student = await makeUser("s-topic@x.com", "student", school.id);
  const app = buildApp();

  const created = await app.inject({
    method: "POST",
    url: "/teacher/topics",
    headers: { authorization: `Bearer ${teacher.token}` },
    payload: { title: "At the Space Station", prompt: "You are a fellow astronaut chatting on the ISS." },
  });
  assert.equal(created.statusCode, 201);
  const topic = created.json();
  assert.equal(topic.title, "At the Space Station");

  const options = (
    await app.inject({ method: "GET", url: "/topics", headers: { authorization: `Bearer ${student.token}` } })
  ).json();
  const custom = options.find((o: { isCustom: boolean }) => o.isCustom);
  assert.ok(custom, "student should see the custom topic");
  assert.equal(custom.value, `custom:${topic.id}`);
  assert.equal(custom.label, "At the Space Station");
  // Built-in scenarios are still present.
  assert.ok(options.some((o: { value: string }) => o.value === "free_talk"));
});

test("a student can start a conversation with an accessible custom topic but not a bogus one", async () => {
  ensureSchema();
  const [school] = await db.insert(schools).values({ name: "S2" }).returning();
  const teacher = await makeUser("t-topic2@x.com", "teacher", school.id);
  const student = await makeUser("s-topic2@x.com", "student", school.id);
  const app = buildApp();

  const topic = (
    await app.inject({
      method: "POST",
      url: "/teacher/topics",
      headers: { authorization: `Bearer ${teacher.token}` },
      payload: { title: "Ordering Pizza", prompt: "You are a pizzeria clerk." },
    })
  ).json();

  const ok = await app.inject({
    method: "POST",
    url: "/conversations",
    headers: { authorization: `Bearer ${student.token}` },
    payload: { scenario: `custom:${topic.id}` },
  });
  assert.equal(ok.statusCode, 201);
  assert.equal(ok.json().scenario, `custom:${topic.id}`);

  const bogus = await app.inject({
    method: "POST",
    url: "/conversations",
    headers: { authorization: `Bearer ${student.token}` },
    payload: { scenario: "custom:99999" },
  });
  assert.equal(bogus.statusCode, 400);
});

test("a student in another school cannot see or use another school's topic", async () => {
  ensureSchema();
  const [schoolA] = await db.insert(schools).values({ name: "A" }).returning();
  const [schoolB] = await db.insert(schools).values({ name: "B" }).returning();
  const teacherA = await makeUser("ta@x.com", "teacher", schoolA.id);
  const studentB = await makeUser("sb@x.com", "student", schoolB.id);
  const app = buildApp();

  const topic = (
    await app.inject({
      method: "POST",
      url: "/teacher/topics",
      headers: { authorization: `Bearer ${teacherA.token}` },
      payload: { title: "School A Only", prompt: "Secret A topic." },
    })
  ).json();

  const options = (
    await app.inject({ method: "GET", url: "/topics", headers: { authorization: `Bearer ${studentB.token}` } })
  ).json();
  assert.ok(!options.some((o: { isCustom: boolean }) => o.isCustom), "student B sees no custom topics");

  const denied = await app.inject({
    method: "POST",
    url: "/conversations",
    headers: { authorization: `Bearer ${studentB.token}` },
    payload: { scenario: `custom:${topic.id}` },
  });
  assert.equal(denied.statusCode, 400);
});

test("a teacher can delete only their own topic; students cannot manage topics", async () => {
  ensureSchema();
  const [school] = await db.insert(schools).values({ name: "S3" }).returning();
  const teacher = await makeUser("t-del@x.com", "teacher", school.id);
  const student = await makeUser("s-del@x.com", "student", school.id);
  const app = buildApp();

  const topic = (
    await app.inject({
      method: "POST", url: "/teacher/topics",
      headers: { authorization: `Bearer ${teacher.token}` },
      payload: { title: "Temp", prompt: "Temp topic." },
    })
  ).json();

  const studentTry = await app.inject({
    method: "POST", url: "/teacher/topics",
    headers: { authorization: `Bearer ${student.token}` },
    payload: { title: "X", prompt: "Y" },
  });
  assert.equal(studentTry.statusCode, 403);

  const del = await app.inject({
    method: "DELETE", url: `/teacher/topics/${topic.id}`,
    headers: { authorization: `Bearer ${teacher.token}` },
  });
  assert.equal(del.statusCode, 200);

  const gone = await app.inject({
    method: "DELETE", url: `/teacher/topics/${topic.id}`,
    headers: { authorization: `Bearer ${teacher.token}` },
  });
  assert.equal(gone.statusCode, 404);
});
