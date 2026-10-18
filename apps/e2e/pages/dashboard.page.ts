import type { Locator, Page } from "@playwright/test";

/** / – start page of someone who belongs to a community */
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

  /** A community the signed-in person belongs to, with their role in it. */
  community(name: string) {
    // Within the page content: a toast in the corner is a list item too
    return this.page
      .getByRole("main")
      .getByRole("listitem")
      .filter({ hasText: name });
  }

  async expectOpen() {
    await this.page.waitForURL((url) => url.pathname === "/");
  }
}
