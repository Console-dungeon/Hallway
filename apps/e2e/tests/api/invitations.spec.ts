import { expect, test } from "../../fixtures";
import { newAccount, signedInRequest } from "../../support/accounts";
import { foundCommunity } from "../../support/communities";
import {
  acceptInvitation,
  expireInvitations,
  invite,
} from "../../support/invitations";
import { SIGNED_OUT } from "../../support/paths";

// `request` is the shared account; it never has the invited address, so whatever it
// tries is refused and it stays without a community. Invitations are sent by `account`.
test.describe("link z zaproszenia w API", () => {
  test("przyjęcie z konta o innym adresie to odmowa 403, a zaproszenie zostaje ważne", async ({
    playwright,
    baseURL,
    request,
    mailpit,
    account,
  }) => {
    const admin = await signedInRequest(playwright, baseURL, account);
    const community = await foundCommunity(admin);
    const link = await invite(admin, mailpit, community, {
      email: newAccount().email,
      role: "worker",
    });

    const response = await request.post(
      `/api/invitations/${link.token}/accept`,
    );

    expect(response.status()).toBe(403);
    expect(await response.json()).toMatchObject({ code: "EMAIL_MISMATCH" });
    const preview = await request.get(`/api/invitations/${link.token}`);
    expect(await preview.json()).toMatchObject({ state: "valid" });
    await admin.dispose();
  });

  test("link starszy niż 7 dni jest wygasły: przyjęcie i rejestracja dostają 410", async ({
    playwright,
    baseURL,
    request,
    mailpit,
    account,
    createAccount,
  }) => {
    const admin = await signedInRequest(playwright, baseURL, account);
    const community = await foundCommunity(admin);
    const invited = await createAccount();
    const withAccount = await invite(admin, mailpit, community, {
      email: invited.email,
      role: "worker",
    });
    const newPerson = newAccount();
    const withoutAccount = await invite(admin, mailpit, community, {
      email: newPerson.email,
      role: "worker",
    });
    await expireInvitations(invited.email);
    await expireInvitations(newPerson.email);
    const invitedRequest = await signedInRequest(playwright, baseURL, invited);

    const preview = await request.get(`/api/invitations/${withAccount.token}`);
    const accept = await invitedRequest.post(
      `/api/invitations/${withAccount.token}/accept`,
    );
    const register = await request.post(
      `/api/invitations/${withoutAccount.token}/register`,
      { data: { name: newPerson.name, password: newPerson.password } },
    );

    expect(await preview.json()).toMatchObject({ state: "expired" });
    expect(accept.status()).toBe(410);
    expect(await accept.json()).toMatchObject({ code: "INVITATION_EXPIRED" });
    expect(register.status()).toBe(410);
    expect(await register.json()).toMatchObject({
      code: "INVITATION_EXPIRED",
    });
    await admin.dispose();
    await invitedRequest.dispose();
  });

  test("nieznany link nie zdradza szczegółów, a przyjęcie to 404", async ({
    request,
  }) => {
    const preview = await request.get(
      "/api/invitations/nie-ma-takiego-zaproszenia",
    );
    const accept = await request.post(
      "/api/invitations/nie-ma-takiego-zaproszenia/accept",
    );

    expect(await preview.json()).toEqual({
      state: "invalid",
      alreadyMember: false,
      accountExists: false,
      invitation: null,
    });
    expect(accept.status()).toBe(404);
    expect(await accept.json()).toMatchObject({ code: "INVITATION_INVALID" });
  });

  test("rejestracja z zaproszenia na adres, który ma już konto, to 409", async ({
    playwright,
    baseURL,
    request,
    mailpit,
    account,
    createAccount,
  }) => {
    const admin = await signedInRequest(playwright, baseURL, account);
    const community = await foundCommunity(admin);
    const invited = await createAccount();
    const link = await invite(admin, mailpit, community, {
      email: invited.email,
      role: "worker",
    });

    const response = await request.post(
      `/api/invitations/${link.token}/register`,
      { data: { name: "Ktoś Inny", password: "inne-haslo-1" } },
    );

    expect(response.status()).toBe(409);
    expect(await response.json()).toMatchObject({ code: "ACCOUNT_EXISTS" });
    await admin.dispose();
  });

  test("zaproszenie dla kogoś, kto już ma rolę, przyjmuje się bez zmiany roli", async ({
    playwright,
    baseURL,
    mailpit,
    account,
  }) => {
    const admin = await signedInRequest(playwright, baseURL, account);
    const community = await foundCommunity(admin);
    // The admin invites themselves as a worker: allowed, and nothing changes
    const link = await invite(admin, mailpit, community, {
      email: account.email,
      role: "worker",
    });

    const accept = await admin.post(`/api/invitations/${link.token}/accept`);

    expect(accept.status()).toBe(200);
    expect(await accept.json()).toEqual({ communityId: community.id });
    const members = await (
      await admin.get(`/api/communities/${community.id}/members`)
    ).json();
    expect(members).toEqual([
      expect.objectContaining({ email: account.email, role: "admin" }),
    ]);
    await admin.dispose();
  });

  test("link działa raz: po usunięciu osoby ze wspólnoty jest nieprawidłowy", async ({
    playwright,
    baseURL,
    mailpit,
    account,
    createAccount,
  }) => {
    const admin = await signedInRequest(playwright, baseURL, account);
    const community = await foundCommunity(admin);
    const worker = await createAccount();
    const workerRequest = await signedInRequest(playwright, baseURL, worker);
    const link = await invite(admin, mailpit, community, {
      email: worker.email,
      role: "worker",
    });
    await acceptInvitation(workerRequest, link);
    const me = await (await workerRequest.get("/api/me")).json();
    await admin.delete(
      `/api/communities/${community.id}/members/${me.user.id}`,
    );

    const preview = await workerRequest.get(`/api/invitations/${link.token}`);
    const accept = await workerRequest.post(
      `/api/invitations/${link.token}/accept`,
    );

    expect(await preview.json()).toMatchObject({ state: "invalid" });
    expect(accept.status()).toBe(404);
    expect(await accept.json()).toMatchObject({ code: "INVITATION_INVALID" });
    await admin.dispose();
    await workerRequest.dispose();
  });

  test.describe("bez sesji", () => {
    test.use({ storageState: SIGNED_OUT });

    test("przyjęcie zaproszenia odmawia z kodem 401", async ({ request }) => {
      const response = await request.post(
        "/api/invitations/nie-ma-takiego-zaproszenia/accept",
      );

      expect(response.status()).toBe(401);
    });
  });
});
