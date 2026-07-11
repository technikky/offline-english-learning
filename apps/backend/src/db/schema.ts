import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
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
