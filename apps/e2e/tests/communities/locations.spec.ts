import { expect, test } from "../../fixtures";
import type { LocationPlace } from "../../pages/community.page";
import { signedInRequest } from "../../support/accounts";
import { addUnit, foundCommunity } from "../../support/communities";
import { addMember } from "../../support/invitations";
import { SIGNED_OUT } from "../../support/paths";

// Every test signs in with its own account. The community is founded through the API
// with one building ("Testowa 7") and one staircase ("A").
test.use({ storageState: SIGNED_OUT });

const building = { name: "Testowa 7", staircases: ["A"] };
const inBuilding = { building: "Testowa 7" };
const inStaircase = { building: "Testowa 7", staircase: "A" };

test.describe("części wspólne", () => {
  test.describe("administrator", () => {
    test.beforeEach(
      async ({ page, loginPage, welcomePage, communityPage, account }) => {
        await loginPage.goto();
        await loginPage.signIn(account);
        await welcomePage.expectOpen();
        const community = await foundCommunity(page.request, { building });
        await communityPage.goto(community.id);
      },
    );

    test("dodaje, zmienia i usuwa część wspólną wspólnoty, budynku i klatki", async ({
      communityPage,
    }) => {
      const places = [
        { place: "community", name: "Parking", newName: "Parking podziemny" },
        { place: inBuilding, name: "Pralnia", newName: "Suszarnia" },
        { place: inStaircase, name: "Winda", newName: "Wózkownia" },
      ] as const;

      for (const { place, name, newName } of places) {
        await communityPage.addLocation(place, name);
        await expect(
          communityPage.toast(`Dodano część wspólną ${name}.`),
        ).toBeVisible();
        await expect(communityPage.locationButton(place, name)).toBeVisible();

        await communityPage.renameLocation(place, name, newName);
        await expect(
          communityPage.toast(`Zapisano część wspólną ${newName}.`),
        ).toBeVisible();
        await expect(
          communityPage.locationButton(place, newName),
        ).toBeVisible();
        await expect(communityPage.locationButton(place, name)).toBeHidden();

        await communityPage.deleteLocation(place, newName);
        await expect(
          communityPage.toast(`Usunięto część wspólną ${newName}.`),
        ).toBeVisible();
        await expect(communityPage.locationButton(place, newName)).toBeHidden();
      }

      // Each place is empty again, and an area never moved to another level
      for (const { place } of places) {
        await expect(communityPage.locations(place)).toContainText(
          "Brak części wspólnych.",
        );
      }
    });

    test("pusta nazwa pokazuje błąd przy polu", async ({ communityPage }) => {
      await communityPage.addLocation("community", "   ");

      await expect(
        communityPage.dialog.getByText("Podaj nazwę części wspólnej"),
      ).toBeVisible();
    });

    test("nazwa zajęta na tym samym poziomie pokazuje błąd, na innym poziomie jest dozwolona", async ({
      communityPage,
    }) => {
      const staircaseTaken =
        "Część wspólna o tej nazwie już istnieje w tej klatce";
      const levels: [LocationPlace, string][] = [
        [
          "community",
          "Część wspólna o tej nazwie już istnieje w tej wspólnocie",
        ],
        [inBuilding, "Część wspólna o tej nazwie już istnieje w tym budynku"],
        [inStaircase, staircaseTaken],
      ];

      for (const [place, error] of levels) {
        // The same name on another level is fine…
        await communityPage.addLocation(place, "Komórka");
        await expect(
          communityPage.locationButton(place, "Komórka"),
        ).toBeVisible();

        // …but not twice on the same one
        await communityPage.addLocation(place, "Komórka");
        await expect(communityPage.dialog.getByText(error)).toBeVisible();
        await communityPage.dialog
          .getByRole("button", { name: "Anuluj" })
          .click();
        await expect(communityPage.dialog).toBeHidden();
      }

      // Renaming onto a taken name is refused as well
      await communityPage.addLocation(inStaircase, "Winda");
      await expect(
        communityPage.locationButton(inStaircase, "Winda"),
      ).toBeVisible();
      await communityPage.renameLocation(inStaircase, "Winda", "Komórka");
      await expect(
        communityPage.dialog.getByText(staircaseTaken),
      ).toBeVisible();
    });

    test("klatka o tej samej nazwie w innym budynku ma własne części wspólne", async ({
      communityPage,
    }) => {
      const otherStaircase = { building: "Testowa 9", staircase: "A" };
      await communityPage.createBuilding({ name: "Testowa 9", staircases: 1 });
      await expect(communityPage.building("Testowa 9")).toBeVisible();

      await communityPage.addLocation(otherStaircase, "Winda");
      await expect(
        communityPage.locationButton(otherStaircase, "Winda"),
      ).toBeVisible();
      await communityPage.addLocation(inStaircase, "Winda");

      await expect(
        communityPage.locationButton(inStaircase, "Winda"),
      ).toBeVisible();
      await expect(communityPage.dialog).toBeHidden();
    });

    test("potwierdzenie usunięcia klatki wspomina jej części wspólne", async ({
      communityPage,
    }) => {
      await communityPage.addLocation(inStaircase, "Winda");
      await expect(
        communityPage.locationButton(inStaircase, "Winda"),
      ).toBeVisible();

      await communityPage
        .staircase("A")
        .getByRole("button", { name: "Usuń klatkę A" })
        .click();
      await expect(communityPage.dialog).toContainText(
        "częściami wspólnymi (1 część wspólna)",
      );
      await communityPage.dialog
        .getByRole("button", { name: "Usuń klatkę" })
        .click();

      await expect(communityPage.toast("Usunięto klatkę A.")).toBeVisible();
      await expect(communityPage.locations(inStaircase)).toBeHidden();
    });
  });

  test("mieszkaniec widzi części wspólne bez przycisków i nie wejdzie w ustawienia", async ({
    page,
    playwright,
    baseURL,
    mailpit,
    account,
    createAccount,
    loginPage,
    communityPage,
    communitySettingsPage,
  }) => {
    const admin = await signedInRequest(
      playwright,
      baseURL,
      await createAccount({ name: "Jan Administrator" }),
    );
    const community = await foundCommunity(admin, { building });
    const path = `/api/communities/${community.id}/locations`;
    const { buildings } = await (
      await admin.get(`/api/communities/${community.id}`)
    ).json();
    const buildingId = buildings[0].id;
    const staircaseId = buildings[0].staircases[0].id;
    await admin.post(path, { data: { name: "Parking" } });
    await admin.post(path, { data: { name: "Pralnia", buildingId } });
    await admin.post(path, {
      data: { name: "Winda", buildingId, staircaseId },
    });
    const unitId = await addUnit(admin, community.id, "1");
    const resident = await signedInRequest(playwright, baseURL, account);
    await addMember(
      admin,
      { request: resident, email: account.email },
      mailpit,
      community,
      { role: "resident", unitId },
    );
    await resident.dispose();
    await loginPage.goto();
    await loginPage.signIn(account);
    await page.waitForURL((url) => url.pathname !== "/login");

    await communityPage.goto(community.id);

    await expect(communityPage.location("community", "Parking")).toBeVisible();
    await expect(communityPage.location(inBuilding, "Pralnia")).toBeVisible();
    await expect(communityPage.location(inStaircase, "Winda")).toBeVisible();
    for (const place of ["community", inBuilding, inStaircase] as const) {
      await expect(
        communityPage.locations(place).getByRole("button"),
      ).toHaveCount(0);
    }
    await expect(communityPage.settings).toBeHidden();
    await communitySettingsPage.goto(community.id);
    await expect(communitySettingsPage.notFound).toBeVisible();
    await expect(communitySettingsPage.heading).toBeHidden();
    await admin.dispose();
  });
});
