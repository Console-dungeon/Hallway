import type { Locator, Page } from "@playwright/test";

/** /welcome – first steps of an account that belongs to no community yet */
export class WelcomePage {
  readonly createCommunity: Locator;
  readonly joinWithInvitation: Locator;
  readonly signOut: Locator;

  constructor(private readonly page: Page) {
    this.createCommunity = page.getByRole("link", {
      name: /Zakładam wspólnotę/,
    });
    this.joinWithInvitation = page.getByRole("link", {
      name: /Mam zaproszenie/,
    });
    this.signOut = page.getByRole("button", { name: "Wyloguj" });
  }

  async goto() {
    await this.page.goto("/welcome");
  }

  /** The greeting uses the first name only: "Ewa" for "Ewa Testowa". */
  greeting(name: string) {
    return this.page.getByRole("heading", {
      name: `Witaj w Hallway, ${name.split(" ")[0]}`,
    });
  }

  async expectOpen() {
    await this.page.waitForURL((url) => url.pathname === "/welcome");
  }
}
