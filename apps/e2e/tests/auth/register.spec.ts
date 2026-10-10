import { expect, test } from "../../fixtures";
import { EMAIL_SUBJECT, newAccount } from "../../support/accounts";
import { SIGNED_OUT } from "../../support/paths";

test.use({ storageState: SIGNED_OUT });

test.describe("rejestracja", () => {
  test.beforeEach(async ({ registerPage }) => {
    await registerPage.goto();
  });

  test("nowe konto po kliknięciu linku z maila jest zalogowane", async ({
    page,
    registerPage,
    verifyEmailPage,
    dashboardPage,
    mailpit,
  }) => {
    const account = newAccount();

    await registerPage.register(account);
    await verifyEmailPage.expectOpen();
    await expect(page.getByText(account.email)).toBeVisible();

    const link = await mailpit.linkFrom({
      to: account.email,
      subject: EMAIL_SUBJECT.verification,
    });
    await page.goto(link);

    await dashboardPage.expectOpen();
    await expect(dashboardPage.greeting(account.name)).toBeVisible();
  });

  test("za krótkie hasło jest odrzucane w formularzu", async ({
    page,
    registerPage,
  }) => {
    await registerPage.register(newAccount({ password: "krotkie" }));

    await expect(
      page.getByText("Hasło musi mieć co najmniej 8 znaków"),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/register$/);
  });

  test("link weryfikacyjny można wysłać ponownie", async ({
    registerPage,
    verifyEmailPage,
  }) => {
    await registerPage.register(newAccount());
    await verifyEmailPage.expectOpen();

    await verifyEmailPage.resend.click();

    await expect(verifyEmailPage.resentNotice).toBeVisible();
  });
});
