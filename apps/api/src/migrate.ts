import { runMigrations } from "@hallway/db";

import { loadEnv } from "./env.js";

// Run before starting a new API version: `node dist/migrate.js`
const env = loadEnv();
await runMigrations(env.DATABASE_URL);
console.log("Database migrations applied");
