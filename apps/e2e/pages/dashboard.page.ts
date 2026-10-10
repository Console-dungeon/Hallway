import type { Locator, Page } from "@playwright/test";

/** / – the signed-in start page */
export class DashboardPage {
  readonly signOut: Locator;

  constructor(private readonly page: Page) {
    this.signOut = page.getByRole("button", { name: "Wyloguj" });
  }

  async goto() {
    await this.page.goto("/");
  }

  greeting(name: string) {
    return this.page.getByRole("heading", { name: `Cześć, ${name}` });
  }

  async expectOpen() {
    await this.page.waitForURL((url) => url.pathname === "/");
  }
}
