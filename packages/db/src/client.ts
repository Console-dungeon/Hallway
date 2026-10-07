import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema.js";

export interface CreateDbOptions {
  /** Called when an idle pooled connection fails (e.g. Postgres restarts). */
  onPoolError?: (error: Error) => void;
}

export function createDb(
  connectionString: string,
  options: CreateDbOptions = {},
) {
  const pool = new Pool({
    connectionString,
    // Fail fast (e.g. in /health) instead of hanging when Postgres is down
    connectionTimeoutMillis: 5_000,
  });
  // Without an "error" listener, a dropped idle connection crashes the whole process
  pool.on(
    "error",
    options.onPoolError ??
      ((error) => console.error("Postgres pool error", error)),
  );

  const db = drizzle({ client: pool, schema, casing: "snake_case" });

  return { db, pool };
}

export type Database = ReturnType<typeof createDb>["db"];
