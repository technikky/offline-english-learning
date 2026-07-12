import { sqliteTable, integer, text, blob } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// Placeholder table proving the migration pipeline end-to-end (Stage 1).
export const systemInfo = sqliteTable("system_info", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "teacher", "student"] }).notNull(),
  displayName: text("display_name").notNull(),
  mustChangePassword: integer("must_change_password", { mode: "boolean" })
    .notNull()
    .default(false),
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
