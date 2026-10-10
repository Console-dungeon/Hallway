import { createDb, eq, users } from "@hallway/db";
import { z } from "zod";

import { loadEnv } from "../env.js";

// Promotes an existing, registered account to platform superadmin:
//   dev:    pnpm --filter @hallway/api create-superadmin <email>
//   server: docker compose exec api node dist/scripts/create-superadmin.js <email>
const email = z.email().safeParse(process.argv[2]);
if (!email.success) {
  console.error("Usage: create-superadmin <email>");
  process.exit(1);
}

const env = loadEnv();
const { db, pool } = createDb(env.DATABASE_URL);
try {
  const updated = await db
    .update(users)
    .set({ role: "superadmin" })
    .where(eq(users.email, email.data.toLowerCase()))
    .returning({ id: users.id });

  if (updated.length === 0) {
    console.error(`No account with e-mail ${email.data} – register it first.`);
    process.exitCode = 1;
  } else {
    console.log(`${email.data} is now a superadmin`);
  }
} finally {
  await pool.end();
}
