import type { Locator, Page } from "@playwright/test";

/** /communities/<id> – a community with its buildings, staircases and units */
export class CommunityPage {
  /** The window open over the page (adding, renaming, confirming). */
  readonly dialog: Locator;
  readonly addBuilding: Locator;
  readonly emptyState: Locator;
  readonly notFound: Locator;

  constructor(private readonly page: Page) {
    this.dialog = page.getByRole("dialog");
    // The empty community shows the button in the middle, a filled one in the header
    this.addBuilding = page.getByRole("button", { name: "Dodaj budynek" });
    this.emptyState = page.getByText("Ta wspólnota nie ma jeszcze budynków");
    this.notFound = page.getByRole("heading", { name: "Nie ma takiej strony" });
  }

  async goto(communityId: string) {
    await this.page.goto(`/communities/${communityId}`);
  }

  building(name: string) {
    return this.page.getByRole("region", { name: `Budynek ${name}` });
  }

  staircase(name: string) {
    return this.page.getByRole("listitem", { name: `Klatka ${name}` });
  }

  /** Unit tiles of a staircase, in the order shown. */
  units(staircaseName: string) {
    return this.page
      .getByRole("list", { name: `Lokale klatki ${staircaseName}` })
      .getByRole("listitem");
  }

  unit(number: string) {
    return this.page.getByRole("button", {
      name: `Lokal ${number}`,
      exact: true,
    });
  }

  /** A sentence shown after a change, in the corner of the screen. */
  toast(text: string) {
    return this.page.getByText(text);
  }

  /** Adds a building with the given number of staircases (A, B, C…; one is there by default). */
  async createBuilding({
    name,
    staircases,
  }: {
    name: string;
    staircases: number;
  }) {
    await this.addBuilding.click();
    await this.dialog.getByLabel("Nazwa budynku").fill(name);
    for (let added = 1; added < staircases; added++) {
      await this.dialog.getByRole("button", { name: "Dodaj klatkę" }).click();
    }
    await this.dialog.getByRole("button", { name: "Dodaj budynek" }).click();
  }

  async createStaircase(buildingName: string, name: string) {
    await this.building(buildingName)
      .getByRole("button", { name: "Dodaj klatkę" })
      .click();
    await this.dialog.getByLabel("Nazwa klatki").fill(name);
    await this.dialog.getByRole("button", { name: "Dodaj klatkę" }).click();
  }

  /** Adds units numbered from…to to a staircase. */
  async createUnitSeries(staircaseName: string, from: number, to: number) {
    await this.staircase(staircaseName)
      .getByRole("button", { name: "Dodaj lokale" })
      .click();
    await this.dialog.getByLabel("Numery od").fill(String(from));
    await this.dialog.getByLabel("do", { exact: true }).fill(String(to));
    await this.dialog.getByRole("button", { name: /^Dodaj \d+ lokal/ }).click();
  }

  async createUnit(staircaseName: string, number: string) {
    await this.staircase(staircaseName)
      .getByRole("button", { name: "Dodaj lokale" })
      .click();
    await this.dialog.getByRole("tab", { name: "Pojedynczo" }).click();
    await this.dialog.getByLabel("Numer lokalu").fill(number);
    await this.dialog
      .getByRole("button", { name: "Dodaj lokal", exact: true })
      .click();
  }
}
