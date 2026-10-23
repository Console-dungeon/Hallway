import { expect, test } from "../../fixtures";
import { foundCommunity } from "../../support/communities";
import { SIGNED_OUT } from "../../support/paths";

// Every test signs in with its own account and founds its community through the API,
// so it is the admin. Who else may open the settings: tests/communities/locations.spec.ts
// and tests/api/locations.spec.ts.
test.use({ storageState: SIGNED_OUT });

test.describe("ustawienia wspólnoty", () => {
  test.beforeEach(async ({ loginPage, welcomePage, account }) => {
    await loginPage.goto();
    await loginPage.signIn(account);
    await welcomePage.expectOpen();
  });

  test("administrator zmienia nazwę i adres, a nowe dane widać na stronie wspólnoty i pulpicie", async ({
    page,
    communityPage,
    communitySettingsPage,
    dashboardPage,
  }) => {
    const community = await foundCommunity(page.request);
    await communityPage.goto(community.id);
    await communityPage.settings.click();
    await communitySettingsPage.expectOpen(community.id);
    await expect(communitySettingsPage.heading).toBeVisible();
    await expect(communitySettingsPage.name).toHaveValue(community.name);

    await communitySettingsPage.saveDetails({
      name: "Wspólnota Mieszkaniowa Lipowa 12",
      address: "ul. Lipowa 12, 30-002 Kraków",
    });

    await expect(communitySettingsPage.toast("Zapisano zmiany")).toBeVisible();
    await communityPage.goto(community.id);
    await expect(
      communityPage.heading("Wspólnota Mieszkaniowa Lipowa 12"),
    ).toBeVisible();
    await expect(
      page.getByText(/^ul\. Lipowa 12, 30-002 Kraków · /),
    ).toBeVisible();
    await dashboardPage.goto();
    await expect(
      dashboardPage.community("Wspólnota Mieszkaniowa Lipowa 12"),
    ).toBeVisible();
    await expect(dashboardPage.community(community.name)).toHaveCount(0);
  });

  test("puste pola nie zapisują się i pokazują błędy", async ({
    page,
    communitySettingsPage,
  }) => {
    const community = await foundCommunity(page.request);
    await communitySettingsPage.goto(community.id);

    await communitySettingsPage.saveDetails({
      name: " ",
      address: "",
    });

    await expect(
      communitySettingsPage.details.getByText("Podaj nazwę wspólnoty"),
    ).toBeVisible();
    await expect(
      communitySettingsPage.details.getByText("Podaj adres wspólnoty"),
    ).toBeVisible();
    await expect(communitySettingsPage.toast("Zapisano zmiany")).toBeHidden();
    await page.reload();
    await expect(communitySettingsPage.name).toHaveValue(community.name);
  });

  test("usunięcie wymaga wpisania dokładnej nazwy; wspólnota znika z pulpitu, a jej adres pokazuje „nie ma takiej strony”", async ({
    page,
    communityPage,
    communitySettingsPage,
    dashboardPage,
  }) => {
    const community = await foundCommunity(page.request, {
      name: "Wspólnota do usunięcia",
    });
    await foundCommunity(page.request, { name: "Wspólnota, która zostaje" });
    await communitySettingsPage.goto(community.id);
    await communitySettingsPage.deleteCommunity.click();

    await expect(communitySettingsPage.confirmDelete).toBeDisabled();
    await communitySettingsPage.confirmation.fill("Wspólnota do usunięci");
    await expect(communitySettingsPage.confirmDelete).toBeDisabled();
    await communitySettingsPage.confirmation.fill("wspólnota do usunięcia");
    await expect(communitySettingsPage.confirmDelete).toBeDisabled();
    await communitySettingsPage.confirmation.fill("Wspólnota do usunięcia");
    await expect(communitySettingsPage.confirmDelete).toBeEnabled();
    await communitySettingsPage.confirmDelete.click();

    await dashboardPage.expectOpen();
    await expect(
      page.getByText("Usunięto wspólnotę Wspólnota do usunięcia"),
    ).toBeVisible();
    await expect(
      dashboardPage.community("Wspólnota, która zostaje"),
    ).toBeVisible();
    await expect(dashboardPage.community("Wspólnota do usunięcia")).toHaveCount(
      0,
    );
    await page.reload();
    await expect(dashboardPage.community("Wspólnota do usunięcia")).toHaveCount(
      0,
    );
    await communityPage.goto(community.id);
    await expect(communityPage.notFound).toBeVisible();
    await communitySettingsPage.goto(community.id);
    await expect(communitySettingsPage.notFound).toBeVisible();
  });

  test("po usunięciu jedynej wspólnoty administrator wraca do pierwszych kroków", async ({
    page,
    communitySettingsPage,
    welcomePage,
  }) => {
    const community = await foundCommunity(page.request);
    await communitySettingsPage.goto(community.id);
    await communitySettingsPage.deleteCommunity.click();
    await communitySettingsPage.confirmation.fill(community.name);

    await communitySettingsPage.confirmDelete.click();

    await welcomePage.expectOpen();
    await expect(
      page.getByText(`Usunięto wspólnotę ${community.name}`),
    ).toBeVisible();
    await expect(welcomePage.createCommunity).toBeVisible();
  });

  test("anulowanie zostawia wspólnotę", async ({
    page,
    communitySettingsPage,
  }) => {
    const community = await foundCommunity(page.request);
    await communitySettingsPage.goto(community.id);
    await communitySettingsPage.deleteCommunity.click();
    await communitySettingsPage.confirmation.fill(community.name);

    await communitySettingsPage.dialog
      .getByRole("button", { name: "Anuluj" })
      .click();

    await expect(communitySettingsPage.dialog).toBeHidden();
    const response = await page.request.get(`/api/communities/${community.id}`);
    expect(response.status()).toBe(200);
  });
});
