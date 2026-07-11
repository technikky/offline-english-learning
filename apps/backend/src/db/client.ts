import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import * as schema from "./schema";

const dataDir = path.resolve(__dirname, "../../../../data");
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = process.env.DB_PATH ?? path.join(dataDir, "app.db");
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });

export function ensureSchema(): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS system_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
      display_name TEXT NOT NULL,
      must_change_password INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (current_timestamp)
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (current_timestamp),
      revoked_at TEXT
    );

    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      teacher_id INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (current_timestamp)
    );

    CREATE TABLE IF NOT EXISTS class_students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER NOT NULL REFERENCES classes(id),
      student_id INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (current_timestamp)
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES users(id),
      scenario TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (current_timestamp)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL REFERENCES conversations(id),
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (current_timestamp)
    );

    CREATE TABLE IF NOT EXISTS grammar_mistakes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id INTEGER NOT NULL REFERENCES messages(id),
      original_text TEXT NOT NULL,
      corrected_text TEXT NOT NULL,
      rule_id TEXT NOT NULL,
      rule_description TEXT NOT NULL,
      category TEXT NOT NULL,
      explanation TEXT,
      example TEXT,
      created_at TEXT NOT NULL DEFAULT (current_timestamp)
    );

    CREATE TABLE IF NOT EXISTS vocabulary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT NOT NULL UNIQUE,
      definition TEXT NOT NULL,
      example TEXT NOT NULL,
      synonyms TEXT NOT NULL,
      antonyms TEXT NOT NULL,
      cefr_level TEXT NOT NULL,
      embedding BLOB NOT NULL,
      created_at TEXT NOT NULL DEFAULT (current_timestamp)
    );

    CREATE TABLE IF NOT EXISTS vocabulary_notebook (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES users(id),
      vocabulary_id INTEGER NOT NULL REFERENCES vocabulary(id),
      source TEXT NOT NULL CHECK (source IN ('manual', 'recommended')),
      created_at TEXT NOT NULL DEFAULT (current_timestamp),
      UNIQUE (student_id, vocabulary_id)
    );
  `);
}
