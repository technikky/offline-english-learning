import "../testSetup";
import { test } from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";
import { ensureSchema, db } from "../db/client";
import { users } from "../db/schema";
import { hashPassword } from "../auth/password";
import { signAccessToken } from "../auth/tokens";
import { registerTeacherRoutes } from "./teacher";

function buildApp() {
  const app = Fastify();
  registerTeacherRoutes(app);
  return app;
}

test("teacher creates a class and registers a student into it", async () => {
  ensureSchema();
  const passwordHash = await hashPassword("teacherpass123");
  const [teacher] = await db
    .insert(users)
    .values({ email: "teach@x.com", passwordHash, role: "teacher", displayName: "Teach" })
    .returning();

  const app = buildApp();
  const token = signAccessToken({ sub: teacher.id, role: "teacher" });

  const classRes = await app.inject({
    method: "POST",
    url: "/teacher/classes",
    headers: { authorization: `Bearer ${token}` },
    payload: { name: "Grade 5 English" },
  });
  assert.equal(classRes.statusCode, 201);
  const { id: classId } = classRes.json();

  const studentRes = await app.inject({
    method: "POST",
    url: `/teacher/classes/${classId}/students`,
    headers: { authorization: `Bearer ${token}` },
    payload: {
      email: "newstudent@x.com",
      password: "studentpass123",
      displayName: "New Student",
    },
  });
  assert.equal(studentRes.statusCode, 201);
  assert.equal(studentRes.json().role, "student");
});
