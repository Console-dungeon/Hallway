import { expect, test } from "../../fixtures";
import { newAccount, signedInRequest } from "../../support/accounts";
import { addUnit, foundCommunity } from "../../support/communities";
import {
  acceptInvitation,
  expireInvitations,
  invite,
} from "../../support/invitations";
import { SIGNED_OUT } from "../../support/paths";

// Tests that only look at a link run in the shared session: they accept nothing, so the
// shared account stays without a community. The invitations are sent by `account`.
test.describe("link z zaproszenia", () => {
  test("zalogowana osoba z innym adresem e-mail dostaje odmowę", async ({
    page,
    playwright,
    baseURL,
    invitationPage,
    welcomePage,
    mailpit,
    account,
  }) => {
    const admin = await signedInRequest(playwright, baseURL, account);
    const community = await foundCommunity(admin);
    const { email } = newAccount();
    const link = await invite(admin, mailpit, community, {
      email,
      role: "worker",
    });

    await invitationPage.goto(link.path);

    await expect(invitationPage.wrongAccountTitle).toBeVisible();
    await expect(
      page.getByText(`To zaproszenie jest dla ${email}`),
    ).toBeVisible();
    await expect(invitationPage.switchAccount).toBeVisible();
    // Signing out here would end the shared session; going back is safe
    await invitationPage.backToDashboard.click();
    await welcomePage.expectOpen();
    await admin.dispose();
  });

  test("nieznany link pokazuje „Link jest nieprawidłowy”", async ({
    invitationPage,
  }) => {
    await invitationPage.goto("/invitations/nie-ma-takiego-zaproszenia");

    await expect(invitationPage.invalidTitle).toBeVisible();
    await expect(invitationPage.backHome).toBeVisible();
  });

  test("wklejony link otwiera zaproszenie, a inny tekst pokazuje błąd", async ({
    baseURL,
    joinPage,
    invitationPage,
  }) => {
    await joinPage.goto();

    await joinPage.openLink("zaproszenie");
    await expect(joinPage.notALinkError).toBeVisible();
    await joinPage.openLink(
      `${baseURL}/invitations/nie-ma-takiego-zaproszenia`,
    );

    await expect(invitationPage.invalidTitle).toBeVisible();
  });

  test("z wklejania linku można wrócić do wyboru", async ({
    joinPage,
    welcomePage,
  }) => {
    await joinPage.goto();

    await joinPage.back.click();

    await welcomePage.expectOpen();
  });

  test.describe("bez sesji", () => {
    test.use({ storageState: SIGNED_OUT });

    test("osoba na niewłaściwym koncie wylogowuje się i wraca do zaproszenia, które proponuje rejestrację", async ({
      page,
      playwright,
      baseURL,
      loginPage,
      welcomePage,
      invitationPage,
      mailpit,
      account,
      createAccount,
    }) => {
      const admin = await signedInRequest(
        playwright,
        baseURL,
        await createAccount({ name: "Jan Administrator" }),
      );
      const community = await foundCommunity(admin);
      const invited = newAccount();
      const link = await invite(admin, mailpit, community, {
        email: invited.email,
        role: "worker",
      });
      await loginPage.goto();
      await loginPage.signIn(account);
      await welcomePage.expectOpen();
      await invitationPage.goto(link.path);
      await expect(invitationPage.wrongAccountTitle).toBeVisible();

      await invitationPage.switchAccount.click();

      await expect(page).toHaveURL(new RegExp(`${link.path}$`));
      await expect(invitationPage.signUpTitle).toBeVisible();
      await expect(invitationPage.email).toHaveValue(invited.email);
      await admin.dispose();
    });

    test("link starszy niż 7 dni pokazuje „Link wygasł”", async ({
      playwright,
      baseURL,
      invitationPage,
      mailpit,
      account,
    }) => {
      const admin = await signedInRequest(playwright, baseURL, account);
      const community = await foundCommunity(admin);
      const { email } = newAccount();
      const link = await invite(admin, mailpit, community, {
        email,
        role: "worker",
      });
      await expireInvitations(email);

      await invitationPage.goto(link.path);

      await expect(invitationPage.expiredTitle).toBeVisible();
      await expect(invitationPage.backHome).toBeVisible();
      await admin.dispose();
    });

    test("link dla kogoś, kto już jest w lokalu, tylko przekierowuje: na logowanie, a po zalogowaniu na pulpit", async ({
      page,
      playwright,
      baseURL,
      loginPage,
      dashboardPage,
      invitationPage,
      mailpit,
      account,
      createAccount,
    }) => {
      const admin = await signedInRequest(
        playwright,
        baseURL,
        await createAccount({ name: "Jan Administrator" }),
      );
      const community = await foundCommunity(admin, {
        building: { name: "Testowa 7", staircases: ["A"] },
      });
      const unitId = await addUnit(admin, community.id, "1");
      const resident = await signedInRequest(playwright, baseURL, account);
      const unitInvitation = {
        email: account.email,
        role: "resident",
        unitId,
      } as const;
      const accepted = await invite(admin, mailpit, community, unitInvitation);
      await acceptInvitation(resident, accepted);
      // Inviting someone who is already there is allowed and sends a new link
      const repeated = await invite(admin, mailpit, community, unitInvitation);

      await invitationPage.goto(repeated.path);
      await expect(page).toHaveURL(/\/login$/);
      await loginPage.signIn(account);
      await dashboardPage.expectOpen();
      await invitationPage.goto(repeated.path);
      await dashboardPage.expectOpen();
      await invitationPage.goto(accepted.path);

      await dashboardPage.expectOpen();
      await expect(dashboardPage.greeting(account.name)).toBeVisible();
      await admin.dispose();
      await resident.dispose();
    });
  });
});
