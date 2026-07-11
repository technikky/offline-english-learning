import "../testSetup";
import { test } from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";
import { ensureSchema, db } from "../db/client";
import {
  classes,
  classStudents,
  conversations,
  grammarMistakes,
  messages,
  users,
} from "../db/schema";
import { hashPassword } from "../auth/password";
import { signAccessToken } from "../auth/tokens";
import { registerTeacherReviewRoutes } from "./teacherReview";

function buildApp() {
  const app = Fastify();
  registerTeacherReviewRoutes(app);
  return app;
}

test("shows grammar mistakes for a class's students, and denies another teacher's class", async () => {
  ensureSchema();
  const passwordHash = await hashPassword("teacherpass123");
  const [teacherA] = await db
    .insert(users)
    .values({ email: "reviewteacha@x.com", passwordHash, role: "teacher", displayName: "A" })
    .returning();
  const [teacherB] = await db
    .insert(users)
    .values({ email: "reviewteachb@x.com", passwordHash, role: "teacher", displayName: "B" })
    .returning();
  const [cls] = await db
    .insert(classes)
    .values({ name: "Class", teacherId: teacherA.id })
    .returning();
  const [student] = await db
    .insert(users)
    .values({ email: "reviewstu@x.com", passwordHash, role: "student", displayName: "Stu" })
    .returning();
  await db.insert(classStudents).values({ classId: cls.id, studentId: student.id });

  const [conversation] = await db
    .insert(conversations)
    .values({ studentId: student.id, scenario: "daily" })
    .returning();
  const [message] = await db
    .insert(messages)
    .values({ conversationId: conversation.id, role: "user", content: "She go home." })
    .returning();
  await db.insert(grammarMistakes).values({
    messageId: message.id,
    originalText: "go",
    correctedText: "goes",
    ruleId: "HE_VERB_AGR",
    ruleDescription: "Agreement error",
    category: "Grammar",
  });

  const app = buildApp();
  const tokenA = signAccessToken({ sub: teacherA.id, role: "teacher" });
  const tokenB = signAccessToken({ sub: teacherB.id, role: "teacher" });

  const res = await app.inject({
    method: "GET",
    url: `/teacher/classes/${cls.id}/mistakes`,
    headers: { authorization: `Bearer ${tokenA}` },
  });
  assert.equal(res.statusCode, 200);
  const mistakes = res.json();
  assert.equal(mistakes.length, 1);
  assert.equal(mistakes[0].studentName, "Stu");
  assert.equal(mistakes[0].correctedText, "goes");

  const deniedRes = await app.inject({
    method: "GET",
    url: `/teacher/classes/${cls.id}/mistakes`,
    headers: { authorization: `Bearer ${tokenB}` },
  });
  assert.equal(deniedRes.statusCode, 404);
});
