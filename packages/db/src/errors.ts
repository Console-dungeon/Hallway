/** Postgres error codes the API reacts to (https://www.postgresql.org/docs/current/errcodes-appendix.html). */
const UNIQUE_VIOLATION = "23505";
const FOREIGN_KEY_VIOLATION = "23503";

/** Drizzle wraps the driver error, so the code is on the error itself or on its cause. */
function hasCode(error: unknown, code: string): boolean {
  if (typeof error !== "object" || error === null) return false;
  if ("code" in error && error.code === code) return true;
  return "cause" in error && hasCode(error.cause, code);
}

/** True when an insert or update broke a UNIQUE constraint (e.g. a name already taken). */
export function isUniqueViolation(error: unknown) {
  return hasCode(error, UNIQUE_VIOLATION);
}

/** True when a delete was refused by a RESTRICT foreign key (e.g. a unit with people in it). */
export function isForeignKeyViolation(error: unknown) {
  return hasCode(error, FOREIGN_KEY_VIOLATION);
}
