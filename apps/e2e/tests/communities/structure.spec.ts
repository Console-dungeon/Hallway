import { expect, test } from "../../fixtures";
import { foundCommunity } from "../../support/communities";
import { SIGNED_OUT } from "../../support/paths";

// Each test signs in with its own account and gets its own community, founded through
// the API with one building ("Testowa 7") and one staircase ("A").
test.use({ storageState: SIGNED_OUT });

test.describe("struktura wspólnoty", () => {
  test.beforeEach(
    async ({ page, loginPage, welcomePage, communityPage, account }) => {
      await loginPage.goto();
      await loginPage.signIn(account);
      await welcomePage.expectOpen();
      const community = await foundCommunity(page.request, {
        building: { name: "Testowa 7", staircases: ["A"] },
      });
      await communityPage.goto(community.id);
    },
  );

  test("administrator dodaje budynek z klatkami", async ({ communityPage }) => {
    await communityPage.createBuilding({ name: "Testowa 9", staircases: 2 });

    await expect(
      communityPage.toast("Dodano budynek Testowa 9."),
    ).toBeVisible();
    await expect(communityPage.building("Testowa 9")).toContainText(
      "2 klatki · 0 lokali",
    );
  });

  test("lokale dodaje się serią, a istniejące numery są pomijane", async ({
    communityPage,
  }) => {
    await communityPage.createUnitSeries("A", 1, 8);
    await expect(communityPage.toast("Dodano 8 lokali.")).toBeVisible();
    await expect(communityPage.units("A")).toHaveCount(8);

    await communityPage.createUnitSeries("A", 5, 10);

    await expect(
      communityPage.toast("Dodano 2 lokale, pominięto 4 już istniejących."),
    ).toBeVisible();
    await expect(communityPage.units("A")).toHaveText([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
    ]);
  });

  test("pojedynczy lokal można dodać, zmienić i usunąć", async ({
    communityPage,
  }) => {
    await communityPage.createUnit("A", "12A");
    await expect(communityPage.unit("12A")).toBeVisible();

    await communityPage.unit("12A").click();
    await communityPage.dialog.getByLabel("Numer lokalu").fill("12B");
    await communityPage.dialog.getByRole("button", { name: "Zapisz" }).click();
    await expect(communityPage.unit("12B")).toBeVisible();

    await communityPage.unit("12B").click();
    await communityPage.dialog
      .getByRole("button", { name: "Usuń lokal" })
      .click();
    await communityPage.dialog
      .getByRole("button", { name: "Usuń lokal" })
      .click();

    await expect(communityPage.toast("Usunięto lokal 12B.")).toBeVisible();
    await expect(communityPage.unit("12B")).toBeHidden();
  });

  test("zajęta nazwa klatki pokazuje błąd przy polu", async ({
    communityPage,
  }) => {
    await communityPage.createStaircase("Testowa 7", "A");

    await expect(
      communityPage.dialog.getByText(
        "Klatka o tej nazwie już istnieje w tym budynku",
      ),
    ).toBeVisible();

    await communityPage.dialog.getByLabel("Nazwa klatki").fill("B");
    await communityPage.dialog
      .getByRole("button", { name: "Dodaj klatkę" })
      .click();

    await expect(communityPage.staircase("B")).toBeVisible();
  });

  test("budynek znika dopiero po potwierdzeniu", async ({ communityPage }) => {
    await communityPage
      .building("Testowa 7")
      .getByRole("button", { name: "Usuń budynek Testowa 7" })
      .click();
    await communityPage.dialog.getByRole("button", { name: "Anuluj" }).click();
    await expect(communityPage.building("Testowa 7")).toBeVisible();

    await communityPage
      .building("Testowa 7")
      .getByRole("button", { name: "Usuń budynek Testowa 7" })
      .click();
    await communityPage.dialog
      .getByRole("button", { name: "Usuń budynek" })
      .click();

    await expect(
      communityPage.toast("Usunięto budynek Testowa 7."),
    ).toBeVisible();
    await expect(communityPage.emptyState).toBeVisible();
  });

  test("adres nieistniejącej wspólnoty pokazuje stronę „nie ma takiej strony”", async ({
    communityPage,
  }) => {
    await communityPage.goto("community_nie_ma");

    await expect(communityPage.notFound).toBeVisible();
  });

  test("pulpit prowadzi do strony wspólnoty", async ({
    page,
    dashboardPage,
    communityPage,
  }) => {
    await dashboardPage.goto();

    await page
      .getByRole("link", { name: /Wspólnota Mieszkaniowa Testowa 7/ })
      .click();

    await expect(communityPage.building("Testowa 7")).toBeVisible();
  });
});
