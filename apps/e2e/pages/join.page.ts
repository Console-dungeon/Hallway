import type { Locator, Page } from "@playwright/test";

/** /join – paste the link from an invitation e-mail */
export class JoinPage {
  readonly link: Locator;
  readonly open: Locator;
  readonly back: Locator;
  readonly notALinkError: Locator;

  constructor(private readonly page: Page) {
    this.link = page.getByLabel("Link z zaproszenia");
    this.open = page.getByRole("button", { name: "Otwórz zaproszenie" });
    this.back = page.getByRole("link", { name: "Wróć do wyboru" });
    this.notALinkError = page.getByText(/^To nie jest link z zaproszenia\./);
  }

  async goto() {
    await this.page.goto("/join");
  }

  async expectOpen() {
    await this.page.waitForURL((url) => url.pathname === "/join");
  }

  async openLink(text: string) {
    await this.link.fill(text);
    await this.open.click();
  }
}
