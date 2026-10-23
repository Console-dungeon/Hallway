import type { Locator, Page } from "@playwright/test";

/**
 * /communities/<id>/settings – admins change the community's name and address, or
 * delete it; for everyone else the page doesn't exist
 */
export class CommunitySettingsPage {
  readonly heading: Locator;
  readonly notFound: Locator;
  /** "Dane wspólnoty": name and address. */
  readonly details: Locator;
  readonly name: Locator;
  readonly address: Locator;
  readonly save: Locator;
  /** "Strefa zagrożenia": deleting the community. */
  readonly dangerZone: Locator;
  readonly deleteCommunity: Locator;
  /** The window that asks for the community's name before deleting it. */
  readonly dialog: Locator;
  readonly confirmation: Locator;
  readonly confirmDelete: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole("heading", { name: "Ustawienia wspólnoty" });
    this.notFound = page.getByRole("heading", { name: "Nie ma takiej strony" });
    this.details = page.getByRole("region", { name: "Dane wspólnoty" });
    this.name = this.details.getByLabel("Nazwa wspólnoty");
    this.address = this.details.getByLabel("Adres");
    this.save = this.details.getByRole("button", { name: "Zapisz zmiany" });
    this.dangerZone = page.getByRole("region", { name: "Strefa zagrożenia" });
    this.deleteCommunity = this.dangerZone.getByRole("button", {
      name: "Usuń wspólnotę",
    });
    this.dialog = page.getByRole("dialog", { name: "Usunąć wspólnotę?" });
    this.confirmation = this.dialog.getByLabel(
      "Wpisz nazwę wspólnoty, aby potwierdzić",
    );
    this.confirmDelete = this.dialog.getByRole("button", {
      name: "Usuń wspólnotę",
    });
  }

  async goto(communityId: string) {
    await this.page.goto(`/communities/${communityId}/settings`);
  }

  async expectOpen(communityId: string) {
    await this.page.waitForURL(
      (url) => url.pathname === `/communities/${communityId}/settings`,
    );
  }

  /** A sentence shown after a change, in the corner of the screen. */
  toast(text: string) {
    return this.page.getByText(text);
  }

  async saveDetails({ name, address }: { name: string; address: string }) {
    await this.name.fill(name);
    await this.address.fill(address);
    await this.save.click();
  }
}
