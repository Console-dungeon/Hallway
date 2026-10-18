import type { Locator, Page } from "@playwright/test";

import type { Account } from "../support/accounts";

/**
 * /invitations/<token> – the page an invitation e-mail links to. What it shows depends on
 * the link and on who opens it: accepting, signing up, the wrong account or a bad link.
 */
export class InvitationPage {
  // Signed in with the invited address
  readonly acceptTitle: Locator;
  readonly accept: Locator;
  // Signed out, no account yet
  readonly signUpTitle: Locator;
  readonly name: Locator;
  readonly email: Locator;
  readonly password: Locator;
  readonly signUp: Locator;
  // Signed in with another address
  readonly wrongAccountTitle: Locator;
  readonly switchAccount: Locator;
  readonly backToDashboard: Locator;
  // The link can't be used
  readonly expiredTitle: Locator;
  readonly invalidTitle: Locator;
  readonly backHome: Locator;

  constructor(private readonly page: Page) {
    this.acceptTitle = page.getByText("Zaproszenie do wspólnoty", {
      exact: true,
    });
    this.accept = page.getByRole("button", { name: "Dołącz do wspólnoty" });
    this.signUpTitle = page.getByText("Załóż konto, aby dołączyć", {
      exact: true,
    });
    this.name = page.getByLabel("Imię i nazwisko");
    this.email = page.getByLabel("E-mail");
    this.password = page.getByLabel("Hasło");
    this.signUp = page.getByRole("button", { name: "Załóż konto i dołącz" });
    this.wrongAccountTitle = page.getByText(
      "To zaproszenie jest dla innego konta",
      { exact: true },
    );
    this.switchAccount = page.getByRole("button", {
      name: "Wyloguj się i zaloguj na właściwe konto",
    });
    this.backToDashboard = page.getByRole("link", { name: "Wróć do pulpitu" });
    this.expiredTitle = page.getByText("Link wygasł", { exact: true });
    this.invalidTitle = page.getByText("Link jest nieprawidłowy", {
      exact: true,
    });
    this.backHome = page.getByRole("link", { name: "Wróć do strony głównej" });
  }

  /** Opens the link from the e-mail (its path, e.g. from `mailpit.invitationFrom`). */
  async goto(path: string) {
    await this.page.goto(path);
  }

  /** Signs up from the invitation; the e-mail is the invitation's and can't be typed. */
  async signUpWith({ name, password }: Pick<Account, "name" | "password">) {
    await this.name.fill(name);
    await this.password.fill(password);
    await this.signUp.click();
  }
}
