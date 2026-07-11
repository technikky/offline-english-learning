import fs from "node:fs";
import path from "node:path";
import { sqlite, dbPath, dataDir, reopenConnection } from "../db/client";

const backupsDir = path.join(dataDir, "backups");

export interface BackupInfo {
  filename: string;
  sizeBytes: number;
  createdAt: string;
}

// better-sqlite3's `.backup()` is an online hot backup: safe to call while
// the server is handling requests, no connection-closing required.
export async function createBackup(): Promise<BackupInfo> {
  fs.mkdirSync(backupsDir, { recursive: true });
  const filename = `${new Date().toISOString().replace(/[:.]/g, "-")}.db`;
  await sqlite.backup(path.join(backupsDir, filename));
  return statBackup(filename);
}

export function listBackups(): BackupInfo[] {
  if (!fs.existsSync(backupsDir)) return [];
  return fs
    .readdirSync(backupsDir)
    .filter((filename) => filename.endsWith(".db"))
    .map(statBackup)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// Restoring, unlike backing up, replaces the live DB file out from under the
// open handle — the connection must be closed and reopened around the copy.
export function restoreBackup(filename: string): void {
  const safeName = path.basename(filename); // guard against path traversal
  const backupPath = path.join(backupsDir, safeName);
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup not found: ${safeName}`);
  }

  sqlite.close();
  fs.copyFileSync(backupPath, dbPath);
  reopenConnection();
}

function statBackup(filename: string): BackupInfo {
  const stat = fs.statSync(path.join(backupsDir, filename));
  return { filename, sizeBytes: stat.size, createdAt: stat.mtime.toISOString() };
}
