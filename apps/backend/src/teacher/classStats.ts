import { count, eq, inArray } from "drizzle-orm";
import { db } from "../db/client";
import {
  classStudents,
  conversations,
  grammarMistakes,
  messages,
  users,
  vocabularyNotebook,
} from "../db/schema";
import { estimateDifficultyLevel } from "../conversations/difficulty";

export interface StudentStats {
  studentId: number;
  displayName: string;
  email: string;
  conversationCount: number;
  mistakeCount: number;
  vocabularyCount: number;
  estimatedLevel: string;
}

export async function getClassStudentStats(classId: number): Promise<StudentStats[]> {
  const roster = await db
    .select({ student: users })
    .from(classStudents)
    .innerJoin(users, eq(classStudents.studentId, users.id))
    .where(eq(classStudents.classId, classId));

  const results: StudentStats[] = [];

  for (const { student } of roster) {
    const [conversationCountRow] = await db
      .select({ value: count() })
      .from(conversations)
      .where(eq(conversations.studentId, student.id));

    const studentConversations = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.studentId, student.id));
    const conversationIds = studentConversations.map((c) => c.id);

    let mistakeCount = 0;
    if (conversationIds.length > 0) {
      const studentMessages = await db
        .select({ id: messages.id })
        .from(messages)
        .where(inArray(messages.conversationId, conversationIds));
      const messageIds = studentMessages.map((m) => m.id);

      if (messageIds.length > 0) {
        const [mistakeCountRow] = await db
          .select({ value: count() })
          .from(grammarMistakes)
          .where(inArray(grammarMistakes.messageId, messageIds));
        mistakeCount = mistakeCountRow.value;
      }
    }

    const [vocabularyCountRow] = await db
      .select({ value: count() })
      .from(vocabularyNotebook)
      .where(eq(vocabularyNotebook.studentId, student.id));

    const estimatedLevel = await estimateDifficultyLevel(student.id);

    results.push({
      studentId: student.id,
      displayName: student.displayName,
      email: student.email,
      conversationCount: conversationCountRow.value,
      mistakeCount,
      vocabularyCount: vocabularyCountRow.value,
      estimatedLevel,
    });
  }

  return results;
}
