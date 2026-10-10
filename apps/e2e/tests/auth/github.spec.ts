import { expect, test } from "../../fixtures";
import { SIGNED_OUT } from "../../support/paths";

test.use({ storageState: SIGNED_OUT });

// The real GitHub consent screen can't be automated; these tests replay what GitHub
// and Better Auth send back to the app.
test.describe("powrót z logowania przez GitHub", () => {
  test("anulowanie pokazuje toast i czyści adres", async ({ page }) => {
    await page.goto("/login?error=access_denied&error_description=denied");

    await expect(
      page.getByText("Logowanie przez GitHub zostało anulowane."),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("odpowiedź z nieznanym stanem wraca na logowanie z komunikatem", async ({
    page,
  }) => {
    await page.goto("/api/auth/callback/github?error=access_denied&state=abc");

    await expect(
      page.getByText("Sesja logowania wygasła. Spróbuj ponownie."),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});
