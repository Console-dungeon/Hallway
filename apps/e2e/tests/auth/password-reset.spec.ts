import { expect, test } from "../../fixtures";
import { EMAIL_SUBJECT } from "../../support/accounts";
import { SIGNED_OUT } from "../../support/paths";

test.use({ storageState: SIGNED_OUT });

test.describe("reset hasła", () => {
  test("link z maila pozwala ustawić nowe hasło i zalogować się nim", async ({
    page,
    passwordResetPage,
    loginPage,
    dashboardPage,
    mailpit,
    account,
  }) => {
    const newPassword = "nowe-haslo-22";

    await passwordResetPage.gotoForgotPassword();
    await passwordResetPage.requestLink(account.email);
    await expect(passwordResetPage.sentNotice).toBeVisible();

    const link = await mailpit.linkFrom({
      to: account.email,
      subject: EMAIL_SUBJECT.passwordReset,
    });
    await page.goto(link);
    await passwordResetPage.setNewPassword(newPassword);

    await expect(page.getByText("Hasło zostało zmienione")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);

    await loginPage.signIn({ email: account.email, password: newPassword });
    await dashboardPage.expectOpen();
  });

  test("nieznany adres dostaje tę samą odpowiedź co istniejący", async ({
    passwordResetPage,
  }) => {
    await passwordResetPage.gotoForgotPassword();
    await passwordResetPage.requestLink("e2e-nie-ma-takiego@example.com");

    await expect(passwordResetPage.sentNotice).toBeVisible();
  });

  test("strona bez tokenu informuje o nieprawidłowym linku", async ({
    page,
    passwordResetPage,
  }) => {
    await page.goto("/reset-password");

    await expect(passwordResetPage.invalidLinkNotice).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Wyślij nowy link" }),
    ).toBeVisible();
  });
});
