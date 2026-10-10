import type { Locator, Page } from "@playwright/test";

/** /verify-email – "check your inbox" */
export class VerifyEmailPage {
  readonly heading: Locator;
  readonly resend: Locator;
  readonly resentNotice: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByText("Sprawdź skrzynkę", { exact: true });
    this.resend = page.getByRole("button", { name: "Wyślij link ponownie" });
    this.resentNotice = page.getByText("Wysłaliśmy nowy link.");
  }

  async expectOpen() {
    await this.page.waitForURL(/\/verify-email/);
  }
}
