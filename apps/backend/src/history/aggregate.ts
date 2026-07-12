import { eq, isNotNull, and } from "drizzle-orm";
import type { LearningHistoryEntry, LearningHistoryResponse } from "@englishclass/types";
import { db } from "../db/client";
import {
  conversations,
  grammarExerciseAttempts,
  listeningResults,
  pronunciationResults,
  quizInstances,
  readingResults,
  writingSubmissions,
} from "../db/schema";
import { getGrammarTopic } from "../grammar/curriculum";
import { getReadingPassage } from "../reading/passages";
import { getListeningClip } from "../listening/clips";
import { getWritingPrompt } from "../writing/prompts";
import { SCENARIO_LABELS, QUIZ_CATEGORY_LABELS } from "@englishclass/types";

/** Aggregates one student's activity across every module into a single
 * reverse-chronological timeline (Stage 22). Each module is a small query;
 * merged and sorted in memory since the counts per student are modest. */
export async function getLearningHistory(
  studentId: number,
  limit = 100,
): Promise<LearningHistoryResponse> {
  const entries: LearningHistoryEntry[] = [];

  const convos = await db
    .select()
    .from(conversations)
    .where(eq(conversations.studentId, studentId));
  for (const c of convos) {
    const label = (SCENARIO_LABELS as Record<string, string>)[c.scenario] ?? c.scenario;
    entries.push({
      type: "conversation",
      title: `Conversation — ${label}`,
      detail: null,
      score: null,
      createdAt: c.createdAt,
    });
  }

  const grammar = await db
    .select()
    .from(grammarExerciseAttempts)
    .where(eq(grammarExerciseAttempts.studentId, studentId));
  for (const g of grammar) {
    entries.push({
      type: "grammar",
      title: `Grammar — ${getGrammarTopic(g.topicId)?.title ?? g.topicId}`,
      detail: g.isCorrect ? "Correct" : "Incorrect",
      score: g.isCorrect ? 100 : 0,
      createdAt: g.createdAt,
    });
  }

  const reading = await db
    .select()
    .from(readingResults)
    .where(eq(readingResults.studentId, studentId));
  for (const r of reading) {
    entries.push({
      type: "reading",
      title: `Reading — ${getReadingPassage(r.passageId)?.title ?? r.passageId}`,
      detail: `${r.correctCount}/${r.totalQuestions} correct`,
      score: r.score,
      createdAt: r.createdAt,
    });
  }

  const listening = await db
    .select()
    .from(listeningResults)
    .where(eq(listeningResults.studentId, studentId));
  for (const l of listening) {
    entries.push({
      type: "listening",
      title: `Listening — ${getListeningClip(l.clipId)?.title ?? l.clipId}`,
      detail: `${l.correctCount}/${l.totalQuestions} correct`,
      score: l.score,
      createdAt: l.createdAt,
    });
  }

  const writing = await db
    .select()
    .from(writingSubmissions)
    .where(eq(writingSubmissions.studentId, studentId));
  for (const w of writing) {
    const overall = Math.round((w.grammarScore + w.vocabularyScore + w.coherenceScore) / 3);
    entries.push({
      type: "writing",
      title: `Writing — ${getWritingPrompt(w.promptId)?.title ?? w.promptId}`,
      detail: `${w.wordCount} words`,
      score: overall,
      createdAt: w.createdAt,
    });
  }

  const quizzes = await db
    .select()
    .from(quizInstances)
    .where(and(eq(quizInstances.studentId, studentId), isNotNull(quizInstances.score)));
  for (const q of quizzes) {
    const cat = (QUIZ_CATEGORY_LABELS as Record<string, string>)[q.category] ?? q.category;
    entries.push({
      type: "quiz",
      title: `Quiz — ${cat} (${q.difficultyLevel})`,
      detail: null,
      score: q.score,
      createdAt: q.createdAt,
    });
  }

  const pronunciation = await db
    .select()
    .from(pronunciationResults)
    .where(eq(pronunciationResults.studentId, studentId));
  for (const p of pronunciation) {
    entries.push({
      type: "pronunciation",
      title: "Pronunciation practice",
      detail: `"${p.targetPhrase}"`,
      score: p.accuracyScore,
      createdAt: p.createdAt,
    });
  }

  entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const scored = entries.filter((e) => e.score !== null);
  const averageScore =
    scored.length > 0
      ? Math.round(scored.reduce((sum, e) => sum + (e.score ?? 0), 0) / scored.length)
      : 0;

  return {
    entries: entries.slice(0, limit),
    totalActivities: entries.length,
    averageScore,
  };
}
