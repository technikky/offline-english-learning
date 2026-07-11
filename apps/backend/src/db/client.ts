import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import * as schema from "./schema";

const dataDir = path.resolve(__dirname, "../../../../data");
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "app.db");
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
  `);
}
