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

  test("kafelek zaproszenia prowadzi do wklejenia linku z e-maila", async ({
    welcomePage,
    joinPage,
  }) => {
    await welcomePage.goto();

    await welcomePage.joinWithInvitation.click();

    await joinPage.expectOpen();
    await expect(joinPage.link).toBeVisible();
  });
});
