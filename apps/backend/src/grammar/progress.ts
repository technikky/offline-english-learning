import { eq } from "drizzle-orm";
import type { GrammarProgressResponse, GrammarTopicProgress } from "@englishclass/types";
import { db } from "../db/client";
import { grammarExerciseAttempts } from "../db/schema";
import { listGrammarTopics } from "./curriculum";

export async function getGrammarProgress(studentId: number): Promise<GrammarProgressResponse> {
  const attempts = await db
    .select()
    .from(grammarExerciseAttempts)
    .where(eq(grammarExerciseAttempts.studentId, studentId));

  const topics: GrammarTopicProgress[] = listGrammarTopics().map((topic) => {
    const topicAttempts = attempts.filter((a) => a.topicId === topic.id);
    const correct = topicAttempts.filter((a) => a.isCorrect).length;
    return {
      topicId: topic.id,
      title: topic.title,
      level: topic.level,
      attempts: topicAttempts.length,
      correct,
      accuracy: topicAttempts.length > 0 ? Math.round((correct / topicAttempts.length) * 100) : 0,
    };
  });

  const totalAttempts = attempts.length;
  const totalCorrect = attempts.filter((a) => a.isCorrect).length;

  return {
    topics,
    overallAccuracy: totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0,
    totalAttempts,
  };
}
