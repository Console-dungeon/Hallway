import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Technical key/value table that proves migrations work end to end.
 * The real domain schema (residents, tickets, ...) comes in phase 2.
 */
export const appSettings = pgTable("app_settings", {
  key: text().primaryKey(),
  value: jsonb().notNull(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
