import { expect, test } from "../../fixtures";
import { signedInRequest } from "../../support/accounts";
import { foundCommunity } from "../../support/communities";
import { acceptInvitation, invite } from "../../support/invitations";

// Who may not change or delete a community: tests/api/locations.spec.ts.
test.describe("zmiana i usuwanie wspólnoty w API", () => {
  test("administrator zmienia nazwę i adres; niepoprawne dane to 400", async ({
    playwright,
    baseURL,
    account,
  }) => {
    const admin = await signedInRequest(playwright, baseURL, account);
    const community = await foundCommunity(admin);
    const path = `/api/communities/${community.id}`;

    const invalid = await admin.patch(path, {
      data: { name: "", address: "ul. Lipowa 12" },
    });
    const update = await admin.patch(path, {
      data: { name: "Wspólnota Lipowa 12", address: "ul. Lipowa 12" },
    });

    expect(invalid.status()).toBe(400);
    expect(update.status()).toBe(200);
    expect(await (await admin.get(path)).json()).toMatchObject({
      name: "Wspólnota Lipowa 12",
      address: "ul. Lipowa 12",
    });
    const me = await (await admin.get("/api/me")).json();
    expect(me.communities).toEqual([
      expect.objectContaining({
        id: community.id,
        name: "Wspólnota Lipowa 12",
      }),
    ]);
    await admin.dispose();
  });

  test("usunięta wspólnota to 404 wszędzie, znika z /me, a jej zaproszenia przestają działać", async ({
    playwright,
    baseURL,
    mailpit,
    account,
    createAccount,
  }) => {
    const admin = await signedInRequest(playwright, baseURL, account);
    const community = await foundCommunity(admin, {
      building: { name: "Testowa 7", staircases: ["A"] },
    });
    const kept = await foundCommunity(admin, {
      name: "Wspólnota, która zostaje",
    });
    const path = `/api/communities/${community.id}`;
    const invited = await createAccount();
    const invitedRequest = await signedInRequest(playwright, baseURL, invited);
    const link = await invite(admin, mailpit, community, {
      email: invited.email,
      role: "worker",
    });

    const remove = await admin.delete(path);

    expect(remove.status()).toBe(200);
    const afterwards = {
      get: (await admin.get(path)).status(),
      update: (
        await admin.patch(path, {
          data: { name: "Wskrzeszona", address: "ul. Lipowa 12" },
        })
      ).status(),
      removeAgain: (await admin.delete(path)).status(),
      addLocation: (
        await admin.post(`${path}/locations`, { data: { name: "Parking" } })
      ).status(),
      addBuilding: (
        await admin.post(`${path}/buildings`, {
          data: { name: "Testowa 9", staircases: [] },
        })
      ).status(),
      members: (await admin.get(`${path}/members`)).status(),
    };
    expect(afterwards).toEqual({
      get: 404,
      update: 404,
      removeAgain: 404,
      addLocation: 404,
      addBuilding: 404,
      members: 404,
    });
    const me = await (await admin.get("/api/me")).json();
    expect(me.communities).toEqual([expect.objectContaining({ id: kept.id })]);
    const preview = await invitedRequest.get(`/api/invitations/${link.token}`);
    expect(await preview.json()).toMatchObject({ state: "invalid" });
    await expect(acceptInvitation(invitedRequest, link)).rejects.toThrow();
    const invitedMe = await (await invitedRequest.get("/api/me")).json();
    expect(invitedMe.communities).toEqual([]);
    await admin.dispose();
    await invitedRequest.dispose();
  });
});
