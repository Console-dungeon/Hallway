import type { Locator, Page } from "@playwright/test";

interface CommunityDetails {
  name: string;
  address: string;
}

/** /communities/new – the wizard that founds a community */
export class CommunityCreatePage {
  readonly name: Locator;
  readonly address: Locator;
  readonly buildingName: Locator;
  readonly addStaircase: Locator;
  readonly staircases: Locator;
  readonly next: Locator;
  readonly back: Locator;
  readonly skipBuilding: Locator;
  readonly summary: Locator;
  readonly create: Locator;
  readonly createdHeading: Locator;
  readonly openCommunity: Locator;

  constructor(private readonly page: Page) {
    this.name = page.getByLabel("Nazwa wspólnoty");
    this.address = page.getByLabel("Adres");
    this.buildingName = page.getByLabel("Nazwa budynku");
    this.addStaircase = page.getByRole("button", { name: "Dodaj klatkę" });
    this.staircases = page
      .getByRole("list", { name: "Klatki schodowe" })
      .getByRole("listitem")
      .filter({ hasText: /^Klatka / });
    this.next = page.getByRole("button", { name: "Dalej" });
    this.back = page.getByRole("button", { name: "Wstecz" });
    this.skipBuilding = page.getByRole("button", { name: "Pomiń ten krok" });
    this.summary = page.getByRole("definition");
    this.create = page.getByRole("button", { name: "Załóż wspólnotę" });
    this.createdHeading = page.getByRole("heading", {
      name: "Wspólnota jest gotowa",
    });
    this.openCommunity = page.getByRole("button", {
      name: "Przejdź do wspólnoty",
    });
  }

  async goto() {
    await this.page.goto("/communities/new");
  }

  /** Step 1: name and address, then on to the building. */
  async fillDetails({ name, address }: CommunityDetails) {
    await this.name.fill(name);
    await this.address.fill(address);
    await this.next.click();
  }

  /** Step 2: a building with the given number of staircases (A, B, C…), then on to the summary. */
  async fillBuilding({
    name,
    staircases,
  }: {
    name: string;
    staircases: number;
  }) {
    await this.buildingName.fill(name);
    for (let added = 1; added < staircases; added++) {
      await this.addStaircase.click();
    }
    await this.next.click();
  }
}
