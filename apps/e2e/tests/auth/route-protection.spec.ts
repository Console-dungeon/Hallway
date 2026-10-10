import { expect, test } from "../../fixtures";
import { SHARED_USER_NAME } from "../../support/accounts";
import { SIGNED_OUT } from "../../support/paths";

test.describe("ochrona tras – zalogowany", () => {
  // No test.use here: tests start with the shared signed-in session

  test("pulpit pokazuje imię zalogowanej osoby", async ({ dashboardPage }) => {
    await dashboardPage.goto();

    await expect(dashboardPage.greeting(SHARED_USER_NAME)).toBeVisible();
  });

  for (const path of ["/login", "/register"]) {
    test(`${path} przekierowuje na pulpit`, async ({ page, dashboardPage }) => {
      await page.goto(path);

      await dashboardPage.expectOpen();
    });
  }
});

test.describe("ochrona tras – niezalogowany", () => {
  test.use({ storageState: SIGNED_OUT });

  test("pulpit przekierowuje na logowanie", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/login$/);
  });

  test("nieważne ciasteczko sesji nie daje dostępu", async ({
    page,
    context,
    baseURL,
  }) => {
    await context.addCookies([
      {
        name: "better-auth.session_token",
        value: "podrobiony.token",
        url: baseURL ?? "http://localhost:3000",
      },
    ]);

    await page.goto("/");

    await expect(page).toHaveURL(/\/login$/);
  });
});
