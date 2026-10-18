import { expect, test } from "../../fixtures";
import { newAccount, signedInRequest } from "../../support/accounts";
import { addUnit, foundCommunity } from "../../support/communities";
import { invite } from "../../support/invitations";
import { invitationSubject } from "../../support/mailpit";
import { SIGNED_OUT } from "../../support/paths";

// Joining a community changes what the account sees everywhere, so every person here has
// their own account: `account` is the admin who invites, `createAccount` the invited one.
test.use({ storageState: SIGNED_OUT });

const building = { name: "Testowa 7", staircases: ["A"] };

test.describe("zapraszanie do wspólnoty", () => {
  test("administrator zaprasza mieszkańca do lokalu, a ten po zalogowaniu dołącza i widzi swój lokal", async ({
    page,
    loginPage,
    welcomePage,
    dashboardPage,
    communityPage,
    invitationPage,
    mailpit,
    account,
    createAccount,
  }) => {
    const resident = await createAccount({ name: "Marek Nowicki" });
    await loginPage.goto();
    await loginPage.signIn(account);
    await welcomePage.expectOpen();
    const community = await foundCommunity(page.request, { building });
    await addUnit(page.request, community.id, "1");
    await communityPage.goto(community.id);

    await communityPage.inviteToUnit("1", {
      email: resident.email,
      role: "Mieszkaniec",
    });
    await expect(
      communityPage.toast(`Wysłano zaproszenie na ${resident.email}`),
    ).toBeVisible();
    await dashboardPage.signOut.click();
    await expect(page).toHaveURL(/\/login$/);
    // The resident opens the link from the e-mail; an existing account signs in first
    const link = await mailpit.invitationFrom({
      to: resident.email,
      communityName: community.name,
    });
    await invitationPage.goto(link.path);
    await expect(loginPage.invitationNotice(community.name)).toBeVisible();
    await expect(loginPage.email).toHaveValue(resident.email);
    await loginPage.password.fill(resident.password);
    await loginPage.submit.click();
    await expect(invitationPage.acceptTitle).toBeVisible();
    await invitationPage.accept.click();

    await communityPage.expectOpen(community.id);
    await expect(
      communityPage.toast(`Dołączono do wspólnoty ${community.name}`),
    ).toBeVisible();
    await expect(
      communityPage.ownUnit("1").getByRole("listitem", { name: resident.name }),
    ).toContainText("Mieszkaniec");
    await expect(communityPage.viewerRole("Mieszkaniec")).toBeVisible();
    await expect(communityPage.tabs).toBeHidden();
  });

  test("administrator zaprasza pracownika, a zalogowany pracownik przyjmuje zaproszenie", async ({
    page,
    loginPage,
    welcomePage,
    dashboardPage,
    communityPage,
    invitationPage,
    mailpit,
    account,
    createAccount,
  }) => {
    const worker = await createAccount({ name: "Marek Nowicki" });
    await loginPage.goto();
    await loginPage.signIn(account);
    await welcomePage.expectOpen();
    const community = await foundCommunity(page.request, { building });
    await communityPage.goto(community.id);

    await communityPage.membersTab.click();
    await expect(communityPage.membersTab).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page).toHaveURL(/\?tab=members$/);
    await communityPage.inviteMember({
      email: worker.email,
      role: "Pracownik",
    });
    await expect(
      communityPage.toast(`Wysłano zaproszenie na ${worker.email}`),
    ).toBeVisible();
    await dashboardPage.signOut.click();
    await expect(page).toHaveURL(/\/login$/);
    await loginPage.signIn(worker);
    await welcomePage.expectOpen();
    const link = await mailpit.invitationFrom({
      to: worker.email,
      communityName: community.name,
    });
    await invitationPage.goto(link.path);
    await expect(invitationPage.acceptTitle).toBeVisible();
    await expect(page.getByRole("definition")).toContainText([
      community.name,
      "Pracownik",
    ]);
    await invitationPage.accept.click();

    await communityPage.expectOpen(community.id);
    await expect(
      communityPage.toast(`Dołączono do wspólnoty ${community.name}`),
    ).toBeVisible();
    await expect(communityPage.viewerRole("Pracownik")).toBeVisible();
    await expect(communityPage.building("Testowa 7")).toBeVisible();
    // Workers see the structure, but neither the members nor any way to change things
    await expect(communityPage.tabs).toBeHidden();
    await expect(communityPage.addBuilding).toBeHidden();
  });

  test("wykonawca potrzebuje nazwy firmy, a po przyjęciu zaproszenia trafia na pulpit", async ({
    page,
    loginPage,
    welcomePage,
    dashboardPage,
    communityPage,
    invitationPage,
    mailpit,
    account,
    createAccount,
  }) => {
    const contractor = await createAccount({ name: "Marek Nowicki" });
    await loginPage.goto();
    await loginPage.signIn(account);
    await welcomePage.expectOpen();
    const community = await foundCommunity(page.request, { building });
    await communityPage.goto(community.id, { tab: "members" });

    await communityPage.inviteToCommunity.click();
    await expect(communityPage.dialog.getByLabel("Nazwa firmy")).toBeHidden();
    await communityPage.sendInvitation({
      email: contractor.email,
      role: "Wykonawca",
    });
    await expect(
      communityPage.dialog.getByText("Podaj nazwę firmy wykonawcy"),
    ).toBeVisible();
    await communityPage.dialog.getByLabel("Nazwa firmy").fill("HydroSerwis");
    await communityPage.dialog
      .getByRole("button", { name: "Wyślij zaproszenie" })
      .click();
    await expect(
      communityPage.toast(`Wysłano zaproszenie na ${contractor.email}`),
    ).toBeVisible();
    await dashboardPage.signOut.click();
    await expect(page).toHaveURL(/\/login$/);
    await loginPage.signIn(contractor);
    await welcomePage.expectOpen();
    const link = await mailpit.invitationFrom({
      to: contractor.email,
      communityName: community.name,
    });
    await invitationPage.goto(link.path);
    await expect(page.getByRole("definition")).toContainText([
      community.name,
      "Wykonawca",
      "HydroSerwis",
    ]);
    await invitationPage.accept.click();

    // Contractors have no community page, so they land on the dashboard
    await dashboardPage.expectOpen();
    await expect(
      page.getByText(`Dołączono do wspólnoty ${community.name}`),
    ).toBeVisible();
    await expect(dashboardPage.community(community.name)).toContainText(
      "Wykonawca",
    );
  });

  test("osoba bez konta zakłada je z zaproszenia i od razu jest we wspólnocie, bez e-maila z potwierdzeniem", async ({
    playwright,
    baseURL,
    communityPage,
    invitationPage,
    mailpit,
    account,
  }) => {
    const admin = await signedInRequest(playwright, baseURL, account);
    const community = await foundCommunity(admin, { building });
    const unitId = await addUnit(admin, community.id, "1");
    const owner = newAccount({ name: "Marek Nowicki" });
    const link = await invite(admin, mailpit, community, {
      email: owner.email,
      role: "owner",
      unitId,
    });

    await invitationPage.goto(link.path);
    await expect(invitationPage.signUpTitle).toBeVisible();
    // The address is the invitation's: shown, but it can't be changed
    await expect(invitationPage.email).toHaveValue(owner.email);
    await expect(invitationPage.email).not.toBeEditable();
    await invitationPage.signUpWith(owner);

    await communityPage.expectOpen(community.id);
    await expect(
      communityPage.toast(`Dołączono do wspólnoty ${community.name}`),
    ).toBeVisible();
    await expect(
      communityPage.ownUnit("1").getByRole("listitem", { name: owner.name }),
    ).toContainText("Właściciel");
    expect(await mailpit.subjectsTo(owner.email)).toEqual([
      invitationSubject(community.name),
    ]);
    await admin.dispose();
  });
});
