import "../testSetup";
import { test } from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";
import { ensureSchema, db } from "../db/client";
import { users } from "../db/schema";
import { hashPassword } from "../auth/password";
import { signAccessToken } from "../auth/tokens";
import { registerConversationRoutes } from "./conversations";

function buildApp() {
  const app = Fastify();
  registerConversationRoutes(app);
  return app;
}

test("a student can create a conversation, and only they can read it back", async () => {
  ensureSchema();
  const passwordHash = await hashPassword("studentpass123");
  const [student] = await db
    .insert(users)
    .values({ email: "stu@x.com", passwordHash, role: "student", displayName: "Stu" })
    .returning();
  const [otherStudent] = await db
    .insert(users)
    .values({ email: "other@x.com", passwordHash, role: "student", displayName: "Other" })
    .returning();

  const app = buildApp();
  const token = signAccessToken({ sub: student.id, role: "student" });
  const otherToken = signAccessToken({ sub: otherStudent.id, role: "student" });

  const created = await app.inject({
    method: "POST",
    url: "/conversations",
    headers: { authorization: `Bearer ${token}` },
    payload: { scenario: "daily_life" },
  });
  assert.equal(created.statusCode, 201);
  const { id } = created.json();

  const ownView = await app.inject({
    method: "GET",
    url: `/conversations/${id}`,
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(ownView.statusCode, 200);
  assert.equal(ownView.json().scenario, "daily_life");

  const otherView = await app.inject({
    method: "GET",
    url: `/conversations/${id}`,
    headers: { authorization: `Bearer ${otherToken}` },
  });
  assert.equal(otherView.statusCode, 404);
});

test("rejects an invalid scenario", async () => {
  ensureSchema();
  const passwordHash = await hashPassword("studentpass123");
  const [student] = await db
    .insert(users)
    .values({ email: "stu2@x.com", passwordHash, role: "student", displayName: "Stu2" })
    .returning();

  const app = buildApp();
  const token = signAccessToken({ sub: student.id, role: "student" });

  const res = await app.inject({
    method: "POST",
    url: "/conversations",
    headers: { authorization: `Bearer ${token}` },
    payload: { scenario: "not-a-real-scenario" },
  });
  assert.equal(res.statusCode, 400);
});

test("requires authentication to create a conversation", async () => {
  const app = buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/conversations",
    payload: { scenario: "daily_life" },
  });
  assert.equal(res.statusCode, 401);
});
