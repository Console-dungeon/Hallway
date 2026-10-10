import { expect, test } from "../../fixtures";
import { newAccount, registerAccount } from "../../support/accounts";
import { SIGNED_OUT } from "../../support/paths";

test.use({ storageState: SIGNED_OUT });

test.describe("logowanie", () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test("zweryfikowane konto trafia na pulpit", async ({
    loginPage,
    dashboardPage,
    account,
  }) => {
    await loginPage.signIn(account);

    await dashboardPage.expectOpen();
    await expect(dashboardPage.greeting(account.name)).toBeVisible();
  });

  test("pusty formularz pokazuje błędy przy polach", async ({
    page,
    loginPage,
  }) => {
    await loginPage.submit.click();

    await expect(page.getByText("Podaj poprawny adres e-mail")).toBeVisible();
    await expect(page.getByText("Podaj hasło")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("błędne hasło pokazuje komunikat i zostawia na stronie logowania", async ({
    page,
    loginPage,
    account,
  }) => {
    await loginPage.signIn({ email: account.email, password: "zle-haslo-123" });

    await expect(
      page.getByText("Nieprawidłowy e-mail lub hasło."),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("konto bez potwierdzonego e-maila trafia na ekran weryfikacji", async ({
    request,
    page,
    loginPage,
    verifyEmailPage,
  }) => {
    const unverified = await registerAccount(request, newAccount());

    await loginPage.signIn(unverified);

    await verifyEmailPage.expectOpen();
    await expect(page.getByText(unverified.email)).toBeVisible();
  });
});
