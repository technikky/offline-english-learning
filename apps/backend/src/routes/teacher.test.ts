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

test("lists a teacher's own classes and a class's roster, but not another teacher's class", async () => {
  ensureSchema();
  const passwordHash = await hashPassword("teacherpass123");
  const [teacherA] = await db
    .insert(users)
    .values({ email: "teacha@x.com", passwordHash, role: "teacher", displayName: "Teacher A" })
    .returning();
  const [teacherB] = await db
    .insert(users)
    .values({ email: "teachb@x.com", passwordHash, role: "teacher", displayName: "Teacher B" })
    .returning();

  const app = buildApp();
  const tokenA = signAccessToken({ sub: teacherA.id, role: "teacher" });
  const tokenB = signAccessToken({ sub: teacherB.id, role: "teacher" });

  const classRes = await app.inject({
    method: "POST",
    url: "/teacher/classes",
    headers: { authorization: `Bearer ${tokenA}` },
    payload: { name: "Grade 6 English" },
  });
  const { id: classId } = classRes.json();

  await app.inject({
    method: "POST",
    url: `/teacher/classes/${classId}/students`,
    headers: { authorization: `Bearer ${tokenA}` },
    payload: {
      email: "rosterstudent@x.com",
      password: "studentpass123",
      displayName: "Roster Student",
    },
  });

  const listRes = await app.inject({
    method: "GET",
    url: "/teacher/classes",
    headers: { authorization: `Bearer ${tokenA}` },
  });
  assert.equal(listRes.statusCode, 200);
  assert.equal(listRes.json().length, 1);

  const detailRes = await app.inject({
    method: "GET",
    url: `/teacher/classes/${classId}`,
    headers: { authorization: `Bearer ${tokenA}` },
  });
  assert.equal(detailRes.statusCode, 200);
  const detail = detailRes.json();
  assert.equal(detail.students.length, 1);
  assert.equal(detail.students[0].displayName, "Roster Student");

  const otherTeacherListRes = await app.inject({
    method: "GET",
    url: "/teacher/classes",
    headers: { authorization: `Bearer ${tokenB}` },
  });
  assert.equal(otherTeacherListRes.json().length, 0);

  const otherTeacherDetailRes = await app.inject({
    method: "GET",
    url: `/teacher/classes/${classId}`,
    headers: { authorization: `Bearer ${tokenB}` },
  });
  assert.equal(otherTeacherDetailRes.statusCode, 404);
});
