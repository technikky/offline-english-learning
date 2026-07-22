import { and, eq, isNotNull } from "drizzle-orm";
import type { CefrLevel, CurriculumResponse, CurriculumUnitDto } from "@englishclass/types";
import { db } from "../db/client";
import {
  conversations,
  grammarExerciseAttempts,
  listeningResults,
  messages,
  quizInstances,
  readingResults,
  writingSubmissions,
} from "../db/schema";
import { COURSE, lessonId, type CourseLesson } from "./course";

const LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

// Which content the student has already "done", by module. Completion is
// derived from the existing per-module result tables rather than tracked
// separately -- the curriculum is a read-time overlay (same philosophy as the
// Stage 22 history view), so finishing an activity through its own module
// counts toward the path automatically, with no double bookkeeping.
export interface CompletionSets {
  grammar: Set<string>; // topic ids answered correctly at least once
  reading: Set<string>; // passage ids with a recorded result
  listening: Set<string>; // clip ids with a recorded result
  writing: Set<string>; // prompt ids submitted
  quiz: Set<string>; // categories with a graded quiz
  conversation: Set<string>; // scenarios the student has actually spoken in
}

export async function getCompletionSets(studentId: number): Promise<CompletionSets> {
  const grammarRows = await db
    .selectDistinct({ v: grammarExerciseAttempts.topicId })
    .from(grammarExerciseAttempts)
    .where(
      and(
        eq(grammarExerciseAttempts.studentId, studentId),
        eq(grammarExerciseAttempts.isCorrect, true),
      ),
    );
  const readingRows = await db
    .selectDistinct({ v: readingResults.passageId })
    .from(readingResults)
    .where(eq(readingResults.studentId, studentId));
  const listeningRows = await db
    .selectDistinct({ v: listeningResults.clipId })
    .from(listeningResults)
    .where(eq(listeningResults.studentId, studentId));
  const writingRows = await db
    .selectDistinct({ v: writingSubmissions.promptId })
    .from(writingSubmissions)
    .where(eq(writingSubmissions.studentId, studentId));
  const quizRows = await db
    .selectDistinct({ v: quizInstances.category })
    .from(quizInstances)
    .where(and(eq(quizInstances.studentId, studentId), isNotNull(quizInstances.score)));
  // A scenario only counts once the student has actually said something in it.
  const conversationRows = await db
    .selectDistinct({ v: conversations.scenario })
    .from(conversations)
    .innerJoin(messages, eq(messages.conversationId, conversations.id))
    .where(and(eq(conversations.studentId, studentId), eq(messages.role, "user")));

  return {
    grammar: new Set(grammarRows.map((r) => r.v)),
    reading: new Set(readingRows.map((r) => r.v)),
    listening: new Set(listeningRows.map((r) => r.v)),
    writing: new Set(writingRows.map((r) => r.v)),
    quiz: new Set(quizRows.map((r) => r.v)),
    conversation: new Set(conversationRows.map((r) => r.v)),
  };
}

export function isLessonComplete(sets: CompletionSets, lesson: CourseLesson): boolean {
  switch (lesson.type) {
    case "grammar":
      return sets.grammar.has(lesson.refId);
    case "reading":
      return sets.reading.has(lesson.refId);
    case "listening":
      return sets.listening.has(lesson.refId);
    case "writing":
      return sets.writing.has(lesson.refId);
    case "quiz":
      return sets.quiz.has(lesson.refId);
    case "conversation":
      return sets.conversation.has(lesson.refId);
    default:
      return false;
  }
}

// Pure assembly of the client-facing curriculum from the completion sets and
// the learner's placement level. Kept DB-free so the progress maths and the
// "where should I start?" recommendation are unit-testable in isolation.
export function buildCurriculum(
  sets: CompletionSets,
  placementLevel: CefrLevel | null,
): CurriculumResponse {
  let completedLessons = 0;
  let totalLessons = 0;

  const units: CurriculumUnitDto[] = COURSE.units.map((unit) => {
    const lessons = unit.lessons.map((lesson) => ({
      id: lessonId(unit.id, lesson),
      type: lesson.type,
      refId: lesson.refId,
      title: lesson.title,
      completed: isLessonComplete(sets, lesson),
    }));
    const completedCount = lessons.filter((l) => l.completed).length;
    completedLessons += completedCount;
    totalLessons += lessons.length;
    return {
      id: unit.id,
      level: unit.level,
      title: unit.title,
      lessons,
      completedCount,
      totalCount: lessons.length,
    };
  });

  // Recommend the first not-yet-finished unit at or above the placement level;
  // fall back to any incomplete unit, then to the placement-level unit, then
  // to the very first unit.
  const startIdx = placementLevel ? Math.max(0, LEVELS.indexOf(placementLevel)) : 0;
  const recommended =
    units.find((u) => LEVELS.indexOf(u.level) >= startIdx && u.completedCount < u.totalCount) ??
    units.find((u) => u.completedCount < u.totalCount) ??
    units.find((u) => LEVELS.indexOf(u.level) >= startIdx) ??
    units[0];

  return {
    courseTitle: COURSE.title,
    units,
    placementLevel,
    recommendedUnitId: recommended ? recommended.id : null,
    completedLessons,
    totalLessons,
  };
}
