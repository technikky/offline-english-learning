import { eq, inArray } from "drizzle-orm";
import type {
  CefrLevel,
  FrequencyPoint,
  GrammarWeakness,
  StudentAnalyticsDto,
  VocabularyGrowthPoint,
} from "@englishclass/types";
import { db } from "../db/client";
import {
  conversations,
  grammarMistakes,
  messages,
  users,
  vocabularyNotebook,
} from "../db/schema";
import { estimateDifficultyLevel } from "../conversations/difficulty";

const PRACTICE_FREQUENCY_WINDOW_DAYS = 30;

function toDateOnly(isoOrSqlTimestamp: string): string {
  // SQLite's CURRENT_TIMESTAMP default format is "YYYY-MM-DD HH:MM:SS"; JS
  // Date.toISOString() based values also start with "YYYY-MM-DD" — slicing
  // the first 10 characters works for both without needing a date library.
  return isoOrSqlTimestamp.slice(0, 10);
}

/** The single aggregation used by both the student's own progress view and
 * a teacher's per-student drilldown — see docs/11-stage8-plan.md. */
export async function getStudentAnalytics(studentId: number): Promise<StudentAnalyticsDto> {
  const student = await db.query.users.findFirst({ where: eq(users.id, studentId) });

  const studentConversations = await db
    .select()
    .from(conversations)
    .where(eq(conversations.studentId, studentId));
  const conversationIds = studentConversations.map((c) => c.id);

  let studentMessages: (typeof messages.$inferSelect)[] = [];
  if (conversationIds.length > 0) {
    studentMessages = await db
      .select()
      .from(messages)
      .where(inArray(messages.conversationId, conversationIds));
  }

  // Practice frequency: conversations started per day, last N days.
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - PRACTICE_FREQUENCY_WINDOW_DAYS);
  const frequencyByDate = new Map<string, number>();
  for (const conversation of studentConversations) {
    if (new Date(conversation.createdAt) < cutoff) continue;
    const date = toDateOnly(conversation.createdAt);
    frequencyByDate.set(date, (frequencyByDate.get(date) ?? 0) + 1);
  }
  const practiceFrequency: FrequencyPoint[] = [...frequencyByDate.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Estimated practice time: span of first-to-last message per conversation, summed.
  const messagesByConversation = new Map<number, (typeof messages.$inferSelect)[]>();
  for (const message of studentMessages) {
    const list = messagesByConversation.get(message.conversationId) ?? [];
    list.push(message);
    messagesByConversation.set(message.conversationId, list);
  }
  let estimatedPracticeMinutes = 0;
  for (const list of messagesByConversation.values()) {
    if (list.length < 2) continue;
    const timestamps = list.map((m) => new Date(m.createdAt).getTime());
    const spanMs = Math.max(...timestamps) - Math.min(...timestamps);
    estimatedPracticeMinutes += spanMs / 60000;
  }

  // Grammar weaknesses: mistake count per category, across this student's messages.
  const messageIds = studentMessages.map((m) => m.id);
  let mistakes: (typeof grammarMistakes.$inferSelect)[] = [];
  if (messageIds.length > 0) {
    mistakes = await db
      .select()
      .from(grammarMistakes)
      .where(inArray(grammarMistakes.messageId, messageIds));
  }
  const weaknessByCategory = new Map<string, number>();
  for (const mistake of mistakes) {
    weaknessByCategory.set(mistake.category, (weaknessByCategory.get(mistake.category) ?? 0) + 1);
  }
  const grammarWeaknesses: GrammarWeakness[] = [...weaknessByCategory.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  // Vocabulary growth: cumulative notebook entries over time.
  const notebookEntries = await db
    .select()
    .from(vocabularyNotebook)
    .where(eq(vocabularyNotebook.studentId, studentId));
  notebookEntries.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const growthByDate = new Map<string, number>();
  for (const entry of notebookEntries) {
    const date = toDateOnly(entry.createdAt);
    growthByDate.set(date, (growthByDate.get(date) ?? 0) + 1);
  }
  let cumulative = 0;
  const vocabularyGrowth: VocabularyGrowthPoint[] = [...growthByDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => {
      cumulative += count;
      return { date, cumulativeCount: cumulative };
    });

  const estimatedLevel = await estimateDifficultyLevel(studentId);

  return {
    studentId,
    displayName: student?.displayName ?? "",
    totalConversations: studentConversations.length,
    totalMessages: studentMessages.length,
    estimatedLevel: estimatedLevel as CefrLevel,
    estimatedPracticeMinutes: Math.round(estimatedPracticeMinutes),
    practiceFrequency,
    grammarWeaknesses,
    vocabularyGrowth,
  };
}
