import "../testSetup";
import { test } from "node:test";
import assert from "node:assert/strict";
import { ensureSchema, db } from "../db/client";
import { conversations, messages, users } from "../db/schema";
import { hashPassword } from "../auth/password";
import { estimateDifficultyLevel } from "./difficulty";

async function createStudent(email: string) {
  const passwordHash = await hashPassword("studentpass123");
  const [student] = await db
    .insert(users)
    .values({ email, passwordHash, role: "student", displayName: "Stu" })
    .returning();
  return student;
}

test("defaults to B1 when the student has no message history", async () => {
  ensureSchema();
  const student = await createStudent("nohistory@x.com");
  const level = await estimateDifficultyLevel(student.id);
  assert.equal(level, "B1");
});

test("estimates a lower band for short, simple messages than for long, varied ones", async () => {
  ensureSchema();

  const simpleStudent = await createStudent("simple@x.com");
  const [simpleConvo] = await db
    .insert(conversations)
    .values({ studentId: simpleStudent.id, scenario: "daily" })
    .returning();
  for (const text of ["I go store.", "I buy food.", "I like cat."]) {
    await db.insert(messages).values({ conversationId: simpleConvo.id, role: "user", content: text });
  }

  const complexStudent = await createStudent("complex@x.com");
  const [complexConvo] = await db
    .insert(conversations)
    .values({ studentId: complexStudent.id, scenario: "debate" })
    .returning();
  const complexTexts = [
    "Although the proposal initially seems reasonable, I believe the underlying assumptions require substantial scrutiny before we proceed further.",
    "Nevertheless, considering the broader economic implications, a more nuanced and comprehensive policy framework would likely yield superior outcomes.",
  ];
  for (const text of complexTexts) {
    await db.insert(messages).values({ conversationId: complexConvo.id, role: "user", content: text });
  }

  const simpleLevel = await estimateDifficultyLevel(simpleStudent.id);
  const complexLevel = await estimateDifficultyLevel(complexStudent.id);

  const order = ["A1", "A2", "B1", "B2", "C1", "C2"];
  assert.ok(
    order.indexOf(simpleLevel) < order.indexOf(complexLevel),
    `expected simple (${simpleLevel}) to rank below complex (${complexLevel})`,
  );
});
