import { randomUUID } from "node:crypto";

import type { APIRequestContext } from "@playwright/test";

import type { Mailpit } from "./mailpit";

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
