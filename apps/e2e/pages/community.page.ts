import { expect, type Locator, type Page } from "@playwright/test";

type Role =
  "Administrator" | "Pracownik" | "Wykonawca" | "Właściciel" | "Mieszkaniec";

/**
 * Where common areas belong: the whole community, a building, or a staircase of a
 * building. A staircase is always looked up within its building: two buildings may
 * both have a staircase "A".
 */
export type LocationPlace =
  "community" | { building: string; staircase?: string };

/**
 * /communities/<id> – a community with its buildings, staircases and units; admins also
 * get the Members tab, owners and residents see the people of their own unit
 */
export class CommunityPage {
  /** The window open over the page (adding, renaming, confirming). */
  readonly dialog: Locator;
  readonly addBuilding: Locator;
  readonly emptyState: Locator;
  readonly notFound: Locator;
  /** "Struktura" / "Członkowie"; only admins (who may list members) have it. */
  readonly tabs: Locator;
  readonly structureTab: Locator;
  readonly membersTab: Locator;
  readonly inviteToCommunity: Locator;
  /** Admins, workers and contractors (the Members tab). */
  readonly members: Locator;
  /** Header link to the community settings; only admins have it. */
  readonly settings: Locator;
  /** The card with the common areas of the community as a whole. */
  readonly communityLocations: Locator;

  constructor(private readonly page: Page) {
    this.dialog = page.getByRole("dialog");
    // The empty community shows the button in the middle, a filled one in the header
    this.addBuilding = page.getByRole("button", { name: "Dodaj budynek" });
    this.emptyState = page.getByText("Ta wspólnota nie ma jeszcze budynków");
    this.notFound = page.getByRole("heading", { name: "Nie ma takiej strony" });
    this.tabs = page.getByRole("tablist", { name: "Widok wspólnoty" });
    this.structureTab = this.tabs.getByRole("tab", { name: "Struktura" });
    this.membersTab = this.tabs.getByRole("tab", { name: "Członkowie" });
    this.inviteToCommunity = page.getByRole("button", {
      name: "Zaproś do wspólnoty",
    });
    this.members = page.getByRole("region", { name: "Członkowie wspólnoty" });
    this.settings = page.getByRole("link", { name: "Ustawienia" });
    this.communityLocations = page.getByRole("region", {
      name: "Części wspólne wspólnoty",
    });
  }

  /** The heading with the community's name. */
  heading(name: string) {
    return this.page.getByRole("heading", { level: 1, name });
  }

  /** Common areas of one place; an admin gets them as buttons, others as plain text. */
  locations(place: LocationPlace) {
    if (place === "community") {
      return this.communityLocations.getByRole("list", {
        name: "Części wspólne wspólnoty",
      });
    }
    const name =
      place.staircase === undefined
        ? `Części wspólne budynku ${place.building}`
        : `Części wspólne klatki ${place.staircase}`;
    return this.building(place.building).getByRole("list", { name });
  }

  /** One common area of a place, whether shown as a button or as text. */
  location(place: LocationPlace, name: string) {
    return this.locations(place).getByText(name, { exact: true });
  }

  /** The admin's button that opens a common area to rename or delete it. */
  locationButton(place: LocationPlace, name: string) {
    return this.locations(place).getByRole("button", { name, exact: true });
  }

  addLocationButton(place: LocationPlace) {
    return this.locations(place).getByRole("button", {
      name: "Dodaj część wspólną",
    });
  }

  /** Opens the add window of a place, types the name and confirms. */
  async addLocation(place: LocationPlace, name: string) {
    await this.addLocationButton(place).click();
    await expect(this.dialog).toContainText("Dodaj część wspólną");
    await this.dialog.getByLabel("Nazwa").fill(name);
    await this.dialog
      .getByRole("button", { name: "Dodaj", exact: true })
      .click();
  }

  async renameLocation(place: LocationPlace, name: string, newName: string) {
    await this.locationButton(place, name).click();
    await this.dialog.getByLabel("Nazwa").fill(newName);
    await this.dialog.getByRole("button", { name: "Zapisz" }).click();
  }

  /** Opens the common area, asks to delete it and confirms. */
  async deleteLocation(place: LocationPlace, name: string) {
    await this.locationButton(place, name).click();
    await this.dialog
      .getByRole("button", { name: "Usuń część wspólną" })
      .click();
    await expect(this.dialog).toContainText(`Usunąć część wspólną ${name}?`);
    await this.dialog
      .getByRole("button", { name: "Usuń część wspólną" })
      .click();
  }

  async goto(communityId: string, { tab }: { tab?: "members" } = {}) {
    await this.page.goto(
      `/communities/${communityId}${tab ? `?tab=${tab}` : ""}`,
    );
  }

  async expectOpen(communityId: string) {
    await this.page.waitForURL(
      (url) => url.pathname === `/communities/${communityId}`,
    );
  }

  /** The line under the community's name: address and what the viewer is here. */
  viewerRole(role: Role | "Podgląd") {
    return this.page.getByText(new RegExp(` · ${role}$`));
  }

  /** A person in the Members tab; their role and company are in the row. */
  member(name: string) {
    return this.members.getByRole("listitem", { name });
  }

  /** For owners and residents: their unit with the people assigned to it. */
  ownUnit(number: string) {
    return this.page.getByRole("region", { name: `Twój lokal ${number}` });
  }

  /** People in the open unit window ("Osoby w lokalu"). */
  unitPeople() {
    return this.dialog.getByRole("list", { name: "Osoby w lokalu" });
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

  /** Fills in the open invitation window and sends it. */
  async sendInvitation({
    email,
    role,
    companyName,
  }: {
    email: string;
    role: Role;
    companyName?: string;
  }) {
    await this.dialog.getByLabel("E-mail").fill(email);
    await this.dialog
      .getByRole("radiogroup", { name: "Rola" })
      .getByRole("radio", { name: role })
      .click();
    if (companyName !== undefined) {
      await this.dialog.getByLabel("Nazwa firmy").fill(companyName);
    }
    await this.dialog
      .getByRole("button", { name: "Wyślij zaproszenie" })
      .click();
  }

  /** Invites someone to the community from the Members tab. */
  async inviteMember(invitation: {
    email: string;
    role: Role;
    companyName?: string;
  }) {
    await this.inviteToCommunity.click();
    await this.sendInvitation(invitation);
  }

  /** Invites someone to a unit from its window (Structure tab). */
  async inviteToUnit(
    number: string,
    invitation: { email: string; role: "Właściciel" | "Mieszkaniec" },
  ) {
    await this.unit(number).click();
    await this.dialog.getByRole("button", { name: "Zaproś do lokalu" }).click();
    await expect(this.dialog).toContainText("Zaproś do lokalu");
    await this.sendInvitation(invitation);
  }

  /** Picks a new role in the open role window (and the company for a contractor), then saves. */
  async saveRole(role: Role, { companyName }: { companyName?: string } = {}) {
    await this.dialog
      .getByRole("radiogroup", { name: "Rola" })
      .getByRole("radio", { name: role })
      .click();
    if (companyName !== undefined) {
      await this.dialog.getByLabel("Nazwa firmy").fill(companyName);
    }
    await this.dialog.getByRole("button", { name: "Zapisz" }).click();
  }

  /** The window that says why a change was refused; "Rozumiem" closes it. */
  refusal(title: string) {
    return this.dialog.filter({ hasText: title });
  }
}
