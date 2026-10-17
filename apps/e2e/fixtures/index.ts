import { test as base } from "@playwright/test";

import { CommunityPage } from "../pages/community.page";
import { CommunityCreatePage } from "../pages/community-create.page";
import { DashboardPage } from "../pages/dashboard.page";
import { LoginPage } from "../pages/login.page";
import { PasswordResetPage } from "../pages/password-reset.page";
import { RegisterPage } from "../pages/register.page";
import { VerifyEmailPage } from "../pages/verify-email.page";
import { WelcomePage } from "../pages/welcome.page";
import {
  type Account,
  createVerifiedAccount,
  newAccount,
} from "../support/accounts";
import { Mailpit } from "../support/mailpit";
import { SIGNED_OUT } from "../support/paths";

interface Fixtures {
  /** Inbox of every e-mail the app sends locally. */
  mailpit: Mailpit;
  /** A fresh account with a confirmed e-mail, created just for this test. */
  account: Account;
  /** Change the data of `account` with `test.use({ accountOverrides: { name: "…" } })`. */
  accountOverrides: Partial<Account>;
  loginPage: LoginPage;
  registerPage: RegisterPage;
  verifyEmailPage: VerifyEmailPage;
  passwordResetPage: PasswordResetPage;
  dashboardPage: DashboardPage;
  welcomePage: WelcomePage;
  communityCreatePage: CommunityCreatePage;
  communityPage: CommunityPage;
}

/**
 * Import `test` and `expect` from here, not from "@playwright/test": this `test` knows
 * the app's pages and helpers. Ask for what you need in the test arguments:
 *
 *   test("…", async ({ loginPage, account }) => { … });
 */
export const test = base.extend<Fixtures>({
  // eslint-disable-next-line no-empty-pattern -- Playwright requires destructuring here
  mailpit: async ({}, use) => {
    await use(new Mailpit());
  },
  accountOverrides: [{}, { option: true }],
  account: async ({ playwright, baseURL, mailpit, accountOverrides }, use) => {
    // Separate context, so creating the account doesn't touch the test's own session.
    // Without an explicit empty state it would start with the project's shared session.
    const request = await playwright.request.newContext({
      ...(baseURL && { baseURL }),
      storageState: SIGNED_OUT,
    });
    await use(
      await createVerifiedAccount(
        request,
        mailpit,
        newAccount(accountOverrides),
      ),
    );
    await request.dispose();
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },
  verifyEmailPage: async ({ page }, use) => {
    await use(new VerifyEmailPage(page));
  },
  passwordResetPage: async ({ page }, use) => {
    await use(new PasswordResetPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  welcomePage: async ({ page }, use) => {
    await use(new WelcomePage(page));
  },
  communityCreatePage: async ({ page }, use) => {
    await use(new CommunityCreatePage(page));
  },
  communityPage: async ({ page }, use) => {
    await use(new CommunityPage(page));
  },
});

export { expect } from "@playwright/test";
