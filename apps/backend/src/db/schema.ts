import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

// Placeholder table proving the migration pipeline end-to-end.
// Real domain tables (users, classes, conversations, ...) land in Stage 3+.
export const systemInfo = sqliteTable("system_info", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});
