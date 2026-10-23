import type { Locator, Page } from "@playwright/test";

import type { Account } from "../support/accounts";

/** /login */
export class LoginPage {
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;

  constructor(private readonly page: Page) {
    this.email = page.getByLabel("E-mail");
    this.password = page.getByLabel("Hasło");
    this.submit = page.getByRole("button", { name: "Zaloguj się" });
    this.forgotPasswordLink = page.getByRole("link", {
      name: "Nie pamiętasz hasła?",
    });
    this.registerLink = page.getByRole("link", { name: "Załóż konto" });
  }

  async goto() {
    await this.page.goto("/login");
  }

  /** Shown when the sign-in leads back to an invitation (/login?invitation=<token>). */
  invitationNotice(communityName: string) {
    return this.page.getByText(
      `Zaloguj się, aby przyjąć zaproszenie do wspólnoty ${communityName}.`,
    );
  }

  async signIn({ email, password }: Pick<Account, "email" | "password">) {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }
}
