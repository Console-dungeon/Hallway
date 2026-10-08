import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { defineConfig } from "drizzle-kit";

// Scripts run from packages/db; the shared .env lives in the repo root
const rootEnv = resolve(process.cwd(), "../../.env");
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

const url = process.env.DATABASE_URL;

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
  // SQL migration files, committed to the repo (we never use `drizzle-kit push`)
  out: "./migrations",
  casing: "snake_case",
  ...(url && { dbCredentials: { url } }),
});
