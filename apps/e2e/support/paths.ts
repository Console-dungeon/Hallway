import path from "node:path";

/** Saved browser session of the shared signed-in account (written by auth.setup.ts). */
export const AUTH_FILE = path.resolve(
  import.meta.dirname,
  "../.auth/user.json",
);

/** Pass to `test.use({ storageState: SIGNED_OUT })` to start a test without a session. */
export const SIGNED_OUT = { cookies: [], origins: [] };
