import "../testSetup";
import { test } from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";
import { ensureSchema, db } from "../db/client";
import { users } from "../db/schema";
import { hashPassword } from "../auth/password";
import { registerAuthRoutes } from "./auth";

function buildApp() {
  const app = Fastify();
  registerAuthRoutes(app);
  return app;
}

test("login succeeds with correct credentials and fails with wrong password", async () => {
  ensureSchema();
  const passwordHash = await hashPassword("correct-horse-battery");
  await db.insert(users).values({
    email: "teacher@example.com",
    passwordHash,
    role: "teacher",
    displayName: "Ms. Smith",
  });

  const app = buildApp();

  const ok = await app.inject({
    method: "POST",
    url: "/auth/login",
    payload: { email: "teacher@example.com", password: "correct-horse-battery" },
  });
  assert.equal(ok.statusCode, 200);
  const body = ok.json();
  assert.equal(body.user.role, "teacher");
  assert.ok(body.accessToken);
  assert.ok(body.refreshToken);

  const bad = await app.inject({
    method: "POST",
    url: "/auth/login",
    payload: { email: "teacher@example.com", password: "wrong" },
  });
  assert.equal(bad.statusCode, 401);
});

test("refresh rotates tokens and the old refresh token can't be reused", async () => {
  ensureSchema();
  const passwordHash = await hashPassword("correct-horse-battery");
  await db.insert(users).values({
    email: "student@example.com",
    passwordHash,
    role: "student",
    displayName: "Stu Dent",
  });

  const app = buildApp();
  const login = await app.inject({
    method: "POST",
    url: "/auth/login",
    payload: { email: "student@example.com", password: "correct-horse-battery" },
  });
  const { refreshToken } = login.json();

  const refreshed = await app.inject({
    method: "POST",
    url: "/auth/refresh",
    payload: { refreshToken },
  });
  assert.equal(refreshed.statusCode, 200);

  const reused = await app.inject({
    method: "POST",
    url: "/auth/refresh",
    payload: { refreshToken },
  });
  assert.equal(reused.statusCode, 401);
});

test("GET /auth/me requires a valid bearer token", async () => {
  ensureSchema();
  const passwordHash = await hashPassword("correct-horse-battery");
  await db.insert(users).values({
    email: "me@example.com",
    passwordHash,
    role: "admin",
    displayName: "Admin Person",
  });

  const app = buildApp();
  const login = await app.inject({
    method: "POST",
    url: "/auth/login",
    payload: { email: "me@example.com", password: "correct-horse-battery" },
  });
  const { accessToken } = login.json();

  const me = await app.inject({
    method: "GET",
    url: "/auth/me",
    headers: { authorization: `Bearer ${accessToken}` },
  });
  assert.equal(me.statusCode, 200);
  assert.equal(me.json().email, "me@example.com");

  const unauthorized = await app.inject({ method: "GET", url: "/auth/me" });
  assert.equal(unauthorized.statusCode, 401);
});
