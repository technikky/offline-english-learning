import { sqliteTable, integer, text, blob, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// Placeholder table proving the migration pipeline end-to-end (Stage 1).
export const systemInfo = sqliteTable("system_info", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

// Stage 20: multi-school tenancy. One row per institution; users belong to a
// school (except the platform super_admin, whose schoolId is null).
export const schools = sqliteTable("schools", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["super_admin", "admin", "teacher", "student"] }).notNull(),
  displayName: text("display_name").notNull(),
  schoolId: integer("school_id").references(() => schools.id), // null for super_admin
  mustChangePassword: integer("must_change_password", { mode: "boolean" })
    .notNull()
    .default(false),
  // Stage 26: result of the adaptive placement test (null until taken). Seeds
  // the learner's starting difficulty instead of the old hardcoded B1 default.
  placementLevel: text("placement_level"),
  placementCompletedAt: text("placement_completed_at"),
  // Stage 28: which language the student is learning. CEFR remains the
  // internal proficiency scale for every language; Chinese is only *labelled*
  // with HSK bands in the UI.
  targetLanguage: text("target_language", { enum: ["english", "chinese"] })
    .notNull()
    .default("english"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const refreshTokens = sqliteTable("refresh_tokens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  revokedAt: text("revoked_at"),
});

export const classes = sqliteTable("classes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  teacherId: integer("teacher_id")
    .notNull()
    .references(() => users.id),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const classStudents = sqliteTable("class_students", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  classId: integer("class_id")
    .notNull()
    .references(() => classes.id),
  studentId: integer("student_id")
    .notNull()
    .references(() => users.id),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const conversations = sqliteTable("conversations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id")
    .notNull()
    .references(() => users.id),
  scenario: text("scenario").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conversationId: integer("conversation_id")
    .notNull()
    .references(() => conversations.id),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const grammarMistakes = sqliteTable("grammar_mistakes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  messageId: integer("message_id")
    .notNull()
    .references(() => messages.id),
  originalText: text("original_text").notNull(),
  correctedText: text("corrected_text").notNull(),
  ruleId: text("rule_id").notNull(),
  ruleDescription: text("rule_description").notNull(),
  category: text("category").notNull(),
  explanation: text("explanation"),
  example: text("example"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

// Shared dictionary cache — one row per distinct word the AI has ever
// explained across the whole school, not per-student. See docs/09-stage6-plan.md.
export const vocabulary = sqliteTable("vocabulary", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  word: text("word").notNull().unique(),
  definition: text("definition").notNull(),
  example: text("example").notNull(),
  synonyms: text("synonyms").notNull(), // JSON-encoded string[]
  antonyms: text("antonyms").notNull(), // JSON-encoded string[]
  cefrLevel: text("cefr_level").notNull(),
  embedding: blob("embedding", { mode: "buffer" }).notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const vocabularyNotebook = sqliteTable("vocabulary_notebook", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id")
    .notNull()
    .references(() => users.id),
  vocabularyId: integer("vocabulary_id")
    .notNull()
    .references(() => vocabulary.id),
  source: text("source", { enum: ["manual", "recommended"] }).notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  // Stage 25: SM-2 spaced-repetition schedule (see vocabulary/srs.ts). A new
  // card is due immediately (dueAt defaults to now), so freshly-saved words
  // enter the review queue right away.
  repetitions: integer("repetitions").notNull().default(0),
  easeFactor: real("ease_factor").notNull().default(2.5),
  intervalDays: integer("interval_days").notNull().default(0),
  lapses: integer("lapses").notNull().default(0),
  dueAt: text("due_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  lastReviewedAt: text("last_reviewed_at"),
});

export const assignments = sqliteTable("assignments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  classId: integer("class_id")
    .notNull()
    .references(() => classes.id),
  teacherId: integer("teacher_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  scenario: text("scenario").notNull(),
  dueDate: text("due_date").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  detail: text("detail"),
  ipAddress: text("ip_address"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const pronunciationResults = sqliteTable("pronunciation_results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id")
    .notNull()
    .references(() => users.id),
  targetPhrase: text("target_phrase").notNull(),
  transcript: text("transcript").notNull(),
  accuracyScore: integer("accuracy_score").notNull(),
  // Stage 30: Mandarin tone score (null for English, or when the recording had
  // too little voiced audio to judge).
  toneScore: integer("tone_score"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

// Stage 14: Grammar Learning Module. topicId references curriculum.ts's
// static topic ids (not a DB foreign key -- the curriculum isn't a table).
export const grammarExerciseAttempts = sqliteTable("grammar_exercise_attempts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id")
    .notNull()
    .references(() => users.id),
  topicId: text("topic_id").notNull(),
  exerciseType: text("exercise_type", { enum: ["multiple_choice", "fill_blank"] }).notNull(),
  question: text("question").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  studentAnswer: text("student_answer").notNull(),
  isCorrect: integer("is_correct", { mode: "boolean" }).notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

// Stage 15: Reading Module. passageId references passages.ts's static
// passage ids (not a DB foreign key -- the passage catalog isn't a table).
// Comprehension questions/summary/vocabulary are generated once per passage
// by the AI and cached here -- unlike grammar exercises, a reading
// comprehension quiz should stay consistent for a given passage rather than
// varying each attempt.
export const readingComprehensionCache = sqliteTable("reading_comprehension_cache", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  passageId: text("passage_id").notNull().unique(),
  summary: text("summary").notNull(),
  vocabularyWords: text("vocabulary_words").notNull(), // JSON-encoded string[]
  questions: text("questions").notNull(), // JSON-encoded ComprehensionQuestion[]
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const readingResults = sqliteTable("reading_results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id")
    .notNull()
    .references(() => users.id),
  passageId: text("passage_id").notNull(),
  score: integer("score").notNull(),
  correctCount: integer("correct_count").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

// Stage 17: Listening Module. Same shape/caching rationale as reading -- the
// clip's audio is TTS-synthesized client-side, so a "clip" is a script whose
// comprehension package is generated once and cached, keyed by clip id.
export const listeningComprehensionCache = sqliteTable("listening_comprehension_cache", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clipId: text("clip_id").notNull().unique(),
  summary: text("summary").notNull(),
  vocabularyWords: text("vocabulary_words").notNull(),
  questions: text("questions").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const listeningResults = sqliteTable("listening_results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id")
    .notNull()
    .references(() => users.id),
  clipId: text("clip_id").notNull(),
  score: integer("score").notNull(),
  correctCount: integer("correct_count").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

// Stage 18: Writing Module. Each submission stores the student's text and the
// AI feedback (scores inline for cheap progress queries; the full feedback
// JSON for re-display). promptId references prompts.ts's static ids.
export const writingSubmissions = sqliteTable("writing_submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id")
    .notNull()
    .references(() => users.id),
  promptId: text("prompt_id").notNull(),
  text: text("text").notNull(),
  wordCount: integer("word_count").notNull(),
  grammarScore: integer("grammar_score").notNull(),
  vocabularyScore: integer("vocabulary_score").notNull(),
  coherenceScore: integer("coherence_score").notNull(),
  feedbackJson: text("feedback_json").notNull(), // full WritingFeedback
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

// Stage 23: instructor-authored conversation topics. A teacher writes a title
// and a system-prompt describing the scenario; students in the same school see
// it in their conversation topic list. Scoped by schoolId for tenant isolation.
export const customTopics = sqliteTable("custom_topics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  teacherId: integer("teacher_id")
    .notNull()
    .references(() => users.id),
  schoolId: integer("school_id").references(() => schools.id),
  title: text("title").notNull(),
  prompt: text("prompt").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

// Stage 26: adaptive placement-test session. `stateJson` holds the staircase
// state (see placement/staircase.ts); `servedItemIdsJson` is the current block's
// item ids, so the server grades against exactly what it served (the client
// never sees correct answers). One in-progress session per student at a time.
export const placementSessions = sqliteTable("placement_sessions", {
  id: text("id").primaryKey(), // uuid
  studentId: integer("student_id")
    .notNull()
    .references(() => users.id),
  stateJson: text("state_json").notNull(),
  servedItemIdsJson: text("served_item_ids_json").notNull(),
  status: text("status", { enum: ["in_progress", "complete"] }).notNull(),
  resultLevel: text("result_level"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  completedAt: text("completed_at"),
});

// Stage 19: Quiz Generator. A generated quiz is stored with its questions
// (including answers/explanations) so grading is server-side and answers
// aren't exposed to the client until after submission. graded flips once
// submitted (a quiz is single-attempt).
export const quizInstances = sqliteTable("quiz_instances", {
  id: text("id").primaryKey(), // uuid
  studentId: integer("student_id")
    .notNull()
    .references(() => users.id),
  category: text("category").notNull(),
  difficultyLevel: text("difficulty_level").notNull(),
  questionsJson: text("questions_json").notNull(), // full questions with answers
  score: integer("score"), // null until graded
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});
