import { createDb, sql } from "@hallway/db";

/**
 * Removes accounts created by the tests (e-mail `e2e-…@example.com`) and the communities
 * they founded; sessions and memberships go with them.
 */
export default async function globalTeardown() {
  const url = process.env.DATABASE_URL;
  if (!url) return;

  const { db, pool } = createDb(url);
  try {
    await db.execute(
      sql`delete from communities where created_by in (select id from users where email like 'e2e-%@example.com')`,
    );
    await db.execute(
      sql`delete from users where email like 'e2e-%@example.com'`,
    );
  } finally {
    await pool.end();
  }
}
