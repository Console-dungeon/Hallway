import { expect, test } from "../../fixtures";

// The shared account belongs to no community, so it starts from the first steps
test.describe("pierwsze kroki", () => {
  test("kafelek zakładania wspólnoty prowadzi do kreatora", async ({
    welcomePage,
    communityCreatePage,
  }) => {
    await welcomePage.goto();

    await welcomePage.createCommunity.click();

    await expect(communityCreatePage.name).toBeVisible();
  });

  test("kafelek zaproszenia informuje, że dołączanie będzie dostępne wkrótce", async ({
    page,
    welcomePage,
  }) => {
    await welcomePage.goto();

    await welcomePage.joinWithInvitation.click();

    await expect(
      page.getByText("Dołączanie przez zaproszenie będzie dostępne wkrótce."),
    ).toBeVisible();
    await welcomePage.expectOpen();
  });
});
