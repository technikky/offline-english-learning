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
