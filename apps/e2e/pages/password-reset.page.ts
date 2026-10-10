import type { Locator, Page } from "@playwright/test";

/** /forgot-password and /reset-password */
export class PasswordResetPage {
  readonly email: Locator;
  readonly sendLink: Locator;
  readonly sentNotice: Locator;
  readonly newPassword: Locator;
  readonly save: Locator;
  readonly invalidLinkNotice: Locator;

  constructor(private readonly page: Page) {
    this.email = page.getByLabel("E-mail");
    this.sendLink = page.getByRole("button", { name: "Wyślij link" });
    this.sentNotice = page.getByText("Jeśli konto z tym adresem istnieje");
    this.newPassword = page.getByLabel("Nowe hasło");
    this.save = page.getByRole("button", { name: "Ustaw nowe hasło" });
    this.invalidLinkNotice = page.getByText(
      "Link do zmiany hasła jest nieprawidłowy lub wygasł.",
    );
  }

  async gotoForgotPassword() {
    await this.page.goto("/forgot-password");
  }

  async requestLink(email: string) {
    await this.email.fill(email);
    await this.sendLink.click();
  }

  async setNewPassword(password: string) {
    await this.newPassword.fill(password);
    await this.save.click();
  }
}
