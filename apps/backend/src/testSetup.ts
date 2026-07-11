import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";

// Imported first (side-effect only) by every auth-related test file so each
// test file gets its own throwaway SQLite database instead of sharing the
// dev data/app.db, which would make tests order-dependent and flaky.
process.env.DB_PATH = path.join(
  os.tmpdir(),
  `englishclass-test-${crypto.randomUUID()}.db`,
);
process.env.JWT_SECRET = "test-secret-not-for-production";
