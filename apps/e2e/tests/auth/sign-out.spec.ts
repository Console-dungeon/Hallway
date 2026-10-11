import { expect, test } from "../../fixtures";
import { SIGNED_OUT } from "../../support/paths";

// Signing out ends the session on the server, so this test signs in with its own
// account instead of using the shared session.
test.use({ storageState: SIGNED_OUT });

test("wylogowanie kończy sesję", async ({
  page,
  loginPage,
  welcomePage,
  account,
}) => {
  await loginPage.goto();
  await loginPage.signIn(account);
  await welcomePage.expectOpen();

  await welcomePage.signOut.click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});
