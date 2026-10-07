import path from "node:path";

import { migrate } from "drizzle-orm/node-postgres/migrator";

import { createDb } from "./client.js";

// Committed SQL migrations ship with the package (see "files" in package.json)
const migrationsFolder = path.join(import.meta.dirname, "../migrations");

/**
 * Applies pending SQL migrations. Used in production instead of `drizzle-kit migrate`
 * (drizzle-kit is a dev tool and is not part of the production image).
 * Shares the migration history table with drizzle-kit, so both can be mixed safely.
 */
export async function runMigrations(connectionString: string) {
  const { db, pool } = createDb(connectionString);
  try {
    await migrate(db, { migrationsFolder });
  } finally {
    await pool.end();
  }
}
