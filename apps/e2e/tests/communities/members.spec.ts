import { expect, test } from "../../fixtures";
import { signedInRequest } from "../../support/accounts";
import { addUnit, foundCommunity } from "../../support/communities";
import { addMember } from "../../support/invitations";
import { SIGNED_OUT } from "../../support/paths";

// Every test signs in with its own account and gets its own community, founded through
// the API with one building ("Testowa 7", staircase "A"). Other people join it through
// invitations accepted over the API.
test.use({ storageState: SIGNED_OUT });

const building = { name: "Testowa 7", staircases: ["A"] };

test.describe("członkowie wspólnoty", () => {
  test.beforeEach(async ({ loginPage, welcomePage, account }) => {
    await loginPage.goto();
    await loginPage.signIn(account);
    await welcomePage.expectOpen();
  });

  test("administrator zmienia rolę członka i usuwa go ze wspólnoty", async ({
    page,
    playwright,
    baseURL,
    communityPage,
    mailpit,
    createAccount,
  }) => {
    const community = await foundCommunity(page.request, { building });
    const worker = await createAccount({ name: "Marek Nowicki" });
    const workerRequest = await signedInRequest(playwright, baseURL, worker);
    await addMember(
      page.request,
      { request: workerRequest, email: worker.email },
      mailpit,
      community,
      { role: "worker" },
    );
    await communityPage.goto(community.id, { tab: "members" });
    await expect(communityPage.member("Marek Nowicki")).toContainText(
      "Pracownik",
    );

    await communityPage.members
      .getByRole("button", { name: "Zmień rolę – Marek Nowicki" })
      .click();
    await communityPage.saveRole("Wykonawca", { companyName: "HydroSerwis" });
    await expect(
      communityPage.toast("Zapisano nową rolę: Marek Nowicki"),
    ).toBeVisible();
    await expect(communityPage.member("Marek Nowicki")).toContainText(
      "Wykonawca",
    );
    await expect(communityPage.member("Marek Nowicki")).toContainText(
      "HydroSerwis",
    );
    await communityPage.members
      .getByRole("button", { name: "Usuń ze wspólnoty – Marek Nowicki" })
      .click();
    await expect(communityPage.dialog).toContainText(
      "Usunąć osobę ze wspólnoty?",
    );
    await communityPage.dialog
      .getByRole("button", { name: "Usuń ze wspólnoty", exact: true })
      .click();

    await expect(
      communityPage.toast("Usunięto ze wspólnoty: Marek Nowicki"),
    ).toBeVisible();
    await expect(communityPage.member("Marek Nowicki")).toBeHidden();
    await workerRequest.dispose();
  });

  test("ostatniego administratora nie da się usunąć ani zmienić mu roli", async ({
    page,
    account,
    communityPage,
  }) => {
    const community = await foundCommunity(page.request, { building });
    await communityPage.goto(community.id, { tab: "members" });

    await communityPage.members
      .getByRole("button", { name: `Usuń ze wspólnoty – ${account.name}` })
      .click();
    await communityPage.dialog
      .getByRole("button", { name: "Usuń ze wspólnoty", exact: true })
      .click();
    await expect(
      communityPage.refusal("Nie można usunąć ostatniego administratora"),
    ).toBeVisible();
    await communityPage.dialog
      .getByRole("button", { name: "Rozumiem" })
      .click();
    await communityPage.members
      .getByRole("button", { name: `Zmień rolę – ${account.name}` })
      .click();
    await communityPage.saveRole("Pracownik");

    await expect(
      communityPage.refusal("Nie można zmienić roli ostatniego administratora"),
    ).toBeVisible();
    await communityPage.dialog
      .getByRole("button", { name: "Rozumiem" })
      .click();
    await expect(communityPage.dialog).toBeHidden();
    await expect(communityPage.member(account.name)).toContainText(
      "Administrator",
    );
  });

  test("administrator, który oddaje swoją rolę, widzi wspólnotę jako pracownik", async ({
    page,
    playwright,
    baseURL,
    account,
    communityPage,
    mailpit,
    createAccount,
  }) => {
    const community = await foundCommunity(page.request, { building });
    const secondAdmin = await createAccount({ name: "Marek Nowicki" });
    const secondAdminRequest = await signedInRequest(
      playwright,
      baseURL,
      secondAdmin,
    );
    await addMember(
      page.request,
      { request: secondAdminRequest, email: secondAdmin.email },
      mailpit,
      community,
      { role: "admin" },
    );
    await communityPage.goto(community.id, { tab: "members" });

    await communityPage.members
      .getByRole("button", { name: `Zmień rolę – ${account.name}` })
      .click();
    await communityPage.saveRole("Pracownik");

    await expect(
      communityPage.toast(`Zapisano nową rolę: ${account.name}`),
    ).toBeVisible();
    await expect(communityPage.viewerRole("Pracownik")).toBeVisible();
    await expect(communityPage.tabs).toBeHidden();
    await expect(communityPage.building("Testowa 7")).toBeVisible();
    await secondAdminRequest.dispose();
  });

  test("administrator zmienia rolę osoby w lokalu i usuwa ją z lokalu", async ({
    page,
    playwright,
    baseURL,
    communityPage,
    mailpit,
    createAccount,
  }) => {
    const community = await foundCommunity(page.request, { building });
    const unitId = await addUnit(page.request, community.id, "1");
    const resident = await createAccount({ name: "Marek Nowicki" });
    const residentRequest = await signedInRequest(
      playwright,
      baseURL,
      resident,
    );
    await addMember(
      page.request,
      { request: residentRequest, email: resident.email },
      mailpit,
      community,
      { role: "resident", unitId },
    );
    await communityPage.goto(community.id);
    await communityPage.unit("1").click();
    await expect(
      communityPage
        .unitPeople()
        .getByRole("listitem", { name: "Marek Nowicki" }),
    ).toContainText("Mieszkaniec");

    await communityPage.dialog
      .getByRole("button", { name: "Zmień rolę w lokalu – Marek Nowicki" })
      .click();
    await communityPage.saveRole("Właściciel");
    await expect(
      communityPage.toast("Zapisano nową rolę: Marek Nowicki"),
    ).toBeVisible();
    await communityPage.unit("1").click();
    await expect(
      communityPage
        .unitPeople()
        .getByRole("listitem", { name: "Marek Nowicki" }),
    ).toContainText("Właściciel");
    await communityPage.dialog
      .getByRole("button", { name: "Usuń z lokalu – Marek Nowicki" })
      .click();
    await expect(communityPage.dialog).toContainText(
      "Usunąć osobę z lokalu 1?",
    );
    await communityPage.dialog
      .getByRole("button", { name: "Usuń z lokalu", exact: true })
      .click();

    await expect(
      communityPage.toast("Usunięto z lokalu 1: Marek Nowicki"),
    ).toBeVisible();
    await communityPage.unit("1").click();
    await expect(
      communityPage.dialog.getByText(
        "Nikt nie jest jeszcze przypisany do tego lokalu",
      ),
    ).toBeVisible();
    await residentRequest.dispose();
  });
});

test.describe("osoby w lokalu", () => {
  test("mieszkaniec widzi osoby ze swojego lokalu, ale nie listę członków ani innych lokali", async ({
    page,
    playwright,
    baseURL,
    loginPage,
    dashboardPage,
    communityPage,
    mailpit,
    account,
    createAccount,
  }) => {
    const admin = await signedInRequest(
      playwright,
      baseURL,
      await createAccount({ name: "Jan Administrator" }),
    );
    const community = await foundCommunity(admin, { building });
    const ownUnitId = await addUnit(admin, community.id, "1");
    const otherUnitId = await addUnit(admin, community.id, "2");
    const people = [
      { account, role: "resident", unitId: ownUnitId },
      {
        account: await createAccount({ name: "Marek Nowicki" }),
        role: "owner",
        unitId: ownUnitId,
      },
      {
        account: await createAccount({ name: "Anna Sąsiadka" }),
        role: "resident",
        unitId: otherUnitId,
      },
    ] as const;
    for (const person of people) {
      const request = await signedInRequest(
        playwright,
        baseURL,
        person.account,
      );
      await addMember(
        admin,
        { request, email: person.account.email },
        mailpit,
        community,
        { role: person.role, unitId: person.unitId },
      );
      await request.dispose();
    }
    await loginPage.goto();
    await loginPage.signIn(account);
    await dashboardPage.expectOpen();

    await communityPage.goto(community.id);

    const ownUnit = communityPage.ownUnit("1");
    await expect(
      ownUnit.getByRole("listitem", { name: account.name }),
    ).toContainText("(Ty)");
    await expect(
      ownUnit.getByRole("listitem", { name: "Marek Nowicki" }),
    ).toContainText("Właściciel");
    await expect(ownUnit.getByRole("listitem")).toHaveCount(2);
    await expect(page.getByText("Anna Sąsiadka")).toBeHidden();
    await expect(communityPage.ownUnit("2")).toBeHidden();
    await expect(communityPage.tabs).toBeHidden();
    await expect(communityPage.addBuilding).toBeHidden();
    // The members tab typed into the address is not there either
    await communityPage.goto(community.id, { tab: "members" });
    await expect(communityPage.ownUnit("1")).toBeVisible();
    await expect(communityPage.members).toBeHidden();
    await admin.dispose();
  });
});
