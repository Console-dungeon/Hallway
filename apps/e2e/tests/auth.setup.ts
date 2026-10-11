import { expect, test as setup } from "../fixtures";
import { SHARED_USER_NAME } from "../support/accounts";
import { AUTH_FILE } from "../support/paths";

// The account every signed-in test shares. Tests must not sign it out or change its
// password – a test that needs to do that asks for its own `account`.
setup.use({ accountOverrides: { name: SHARED_USER_NAME } });

setup(
  "sign in once and save the session",
  async ({ page, loginPage, welcomePage, account }) => {
    await loginPage.goto();
    await loginPage.signIn(account);
    await welcomePage.expectOpen();
    await expect(welcomePage.greeting(account.name)).toBeVisible();

    await page.context().storageState({ path: AUTH_FILE });
  },
);
