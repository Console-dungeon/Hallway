import { randomUUID } from "node:crypto";

import type { APIRequestContext, PlaywrightWorkerArgs } from "@playwright/test";

import type { Mailpit } from "./mailpit";
import { SIGNED_OUT } from "./paths";

export interface Account {
  name: string;
  email: string;
  password: string;
}

/** Name of the account every signed-in test shares (created in tests/auth.setup.ts). */
export const SHARED_USER_NAME = "Ewa Zalogowana";

/** Subjects of the e-mails the app sends (apps/api/src/auth/email-templates). */
export const EMAIL_SUBJECT = {
  verification: "Potwierdź adres e-mail",
  passwordReset: "Reset hasła",
};

/**
 * Data for a brand-new account. The `e2e-` prefix marks test data: global-teardown.ts
 * deletes every account whose e-mail starts with it.
 */
export function newAccount(overrides: Partial<Account> = {}): Account {
  return {
    name: "Ewa Testowa",
    email: `e2e-${randomUUID().slice(0, 12)}@example.com`,
    password: "haslo-testowe-1",
    ...overrides,
  };
}

/** Registers an account through the API; it still has to confirm its e-mail. */
export async function registerAccount(
  request: APIRequestContext,
  account: Account = newAccount(),
) {
  const response = await request.post("/api/auth/sign-up/email", {
    data: { ...account, callbackURL: "/" },
  });
  if (!response.ok()) {
    throw new Error(`Sign-up failed: ${response.status()}`);
  }
  return account;
}

/**
 * Registers an account and confirms its e-mail, without touching the UI. Use it whenever
 * a test needs "some existing user" and registration itself is not what is being tested.
 */
export async function createVerifiedAccount(
  request: APIRequestContext,
  mailpit: Mailpit,
  account: Account = newAccount(),
) {
  await registerAccount(request, account);
  const link = await mailpit.linkFrom({
    to: account.email,
    subject: EMAIL_SUBJECT.verification,
  });
  const response = await request.get(link);
  if (!response.ok()) {
    throw new Error(`E-mail verification failed: ${response.status()}`);
  }
  return account;
}

/**
 * An API client signed in as the given account, separate from the test's own session.
 * Use it to prepare data as "someone else", e.g. the admin of a community the test's
 * user does not belong to. Dispose it at the end of the test.
 */
export async function signedInRequest(
  playwright: PlaywrightWorkerArgs["playwright"],
  baseURL: string | undefined,
  account: Pick<Account, "email" | "password">,
) {
  const request = await playwright.request.newContext({
    ...(baseURL && { baseURL }),
    // Start clean; otherwise the context inherits the project's shared session
    storageState: SIGNED_OUT,
  });
  const response = await request.post("/api/auth/sign-in/email", {
    data: { email: account.email, password: account.password },
  });
  if (!response.ok()) {
    throw new Error(`Sign-in failed: ${response.status()}`);
  }
  return request;
}
