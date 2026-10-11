import { expect, test } from "../../fixtures";
import { SIGNED_OUT } from "../../support/paths";

// Founding a community changes what the account sees everywhere, so each test signs in
// with its own account instead of the shared session.
test.use({ storageState: SIGNED_OUT });

const community = {
  name: "Wspólnota Mieszkaniowa Testowa 7",
  address: "ul. Testowa 7, 30-001 Kraków",
};

test.describe("zakładanie wspólnoty", () => {
  test.beforeEach(async ({ loginPage, welcomePage, account }) => {
    await loginPage.goto();
    await loginPage.signIn(account);
    await welcomePage.expectOpen();
  });

  test("nowa osoba zakłada wspólnotę z budynkiem i zostaje jej administratorem", async ({
    page,
    welcomePage,
    communityCreatePage,
    dashboardPage,
  }) => {
    await welcomePage.createCommunity.click();
    await communityCreatePage.fillDetails(community);
    await communityCreatePage.fillBuilding({
      name: "Testowa 7",
      staircases: 3,
    });

    await expect(communityCreatePage.summary).toContainText([
      community.name,
      community.address,
      "Testowa 7",
      "A, B, C",
      "Administrator",
    ]);
    await communityCreatePage.create.click();
    await expect(communityCreatePage.createdHeading).toBeVisible();
    await communityCreatePage.openCommunity.click();

    await dashboardPage.expectOpen();
    await expect(dashboardPage.community(community.name)).toContainText(
      "Administrator",
    );
    // Someone who belongs to a community no longer starts from the first steps
    await welcomePage.goto();
    await dashboardPage.expectOpen();
    await expect(page.getByText(community.name)).toBeVisible();
  });

  test("krok z budynkiem można pominąć", async ({
    communityCreatePage,
    dashboardPage,
  }) => {
    await communityCreatePage.goto();
    await communityCreatePage.fillDetails(community);
    await communityCreatePage.skipBuilding.click();

    await expect(communityCreatePage.summary).toContainText([
      community.name,
      community.address,
      "dodasz później",
      "Administrator",
    ]);
    await communityCreatePage.create.click();
    await communityCreatePage.openCommunity.click();

    await dashboardPage.expectOpen();
    await expect(dashboardPage.community(community.name)).toBeVisible();
  });

  test("puste pola pokazują błędy i nie przepuszczają dalej", async ({
    page,
    communityCreatePage,
  }) => {
    await communityCreatePage.goto();
    await communityCreatePage.next.click();

    await expect(page.getByText("Podaj nazwę wspólnoty")).toBeVisible();
    await expect(page.getByText("Podaj adres wspólnoty")).toBeVisible();

    await communityCreatePage.fillDetails(community);
    await communityCreatePage.next.click();

    await expect(page.getByText("Podaj nazwę budynku")).toBeVisible();
  });

  test("powrót do wcześniejszego kroku zachowuje wpisane dane", async ({
    communityCreatePage,
  }) => {
    await communityCreatePage.goto();
    await communityCreatePage.fillDetails(community);
    await communityCreatePage.fillBuilding({
      name: "Testowa 7",
      staircases: 2,
    });

    await communityCreatePage.back.click();
    await expect(communityCreatePage.buildingName).toHaveValue("Testowa 7");
    await expect(communityCreatePage.staircases).toHaveCount(2);

    await communityCreatePage.back.click();
    await expect(communityCreatePage.name).toHaveValue(community.name);
    await expect(communityCreatePage.address).toHaveValue(community.address);
  });
});
