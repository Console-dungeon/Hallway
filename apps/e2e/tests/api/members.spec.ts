import type { APIRequestContext, APIResponse } from "@playwright/test";

import { expect, test } from "../../fixtures";
import { newAccount, signedInRequest } from "../../support/accounts";
import { addUnit, foundCommunity } from "../../support/communities";
import { addMember } from "../../support/invitations";
import { SIGNED_OUT } from "../../support/paths";

const building = { name: "Testowa 7", staircases: ["A"] };

/**
 * One request to every endpoint about people in the community, as `request` is signed in.
 * `userId` is the person changed or removed, `unitId` the unit asked about.
 */
function everyMembersEndpoint(
  request: APIRequestContext,
  { communityId, unitId, userId }: Record<string, string>,
) {
  const path = `/api/communities/${communityId}`;
  const unit = `${path}/units/${unitId}`;
  const email = newAccount().email;
  return {
    "communityMembers.invite": () =>
      request.post(`${path}/invitations`, { data: { email, role: "worker" } }),
    "unitMembers.invite": () =>
      request.post(`${unit}/invitations`, { data: { email, role: "owner" } }),
    "members.list": () => request.get(`${path}/members`),
    "members.update": () =>
      request.patch(`${path}/members/${userId}`, { data: { role: "worker" } }),
    "members.remove": () => request.delete(`${path}/members/${userId}`),
    "unitMembers.list": () => request.get(`${unit}/members`),
    "unitMembers.update": () =>
      request.patch(`${unit}/members/${userId}`, { data: { role: "owner" } }),
    "unitMembers.remove": () => request.delete(`${unit}/members/${userId}`),
  };
}

/** Status of each call, keyed by endpoint, so a failure names the endpoint. */
async function statuses(calls: Record<string, () => Promise<APIResponse>>) {
  const entries = [];
  for (const [name, call] of Object.entries(calls)) {
    entries.push([name, (await call()).status()] as const);
  }
  return Object.fromEntries(entries);
}

/** The same status for every endpoint in `result`, to compare it with. */
function each(result: Record<string, number>, status: number) {
  return Object.fromEntries(Object.keys(result).map((name) => [name, status]));
}

function only<T extends Record<string, unknown>>(calls: T, names: (keyof T)[]) {
  return Object.fromEntries(names.map((name) => [name, calls[name]]));
}

async function userIdOf(request: APIRequestContext) {
  return (
    (await (await request.get("/api/me")).json()) as {
      user: { id: string };
    }
  ).user.id;
}

// `request` is the shared account, which belongs to no community: here it plays the
// outsider. Communities are founded by separate accounts, their admins.
test.describe("uprawnienia do członków wspólnoty", () => {
  test("osoba spoza wspólnoty dostaje 403 na każdym endpoincie i niczego nie zmienia", async ({
    playwright,
    baseURL,
    request,
    account,
  }) => {
    const admin = await signedInRequest(playwright, baseURL, account);
    const community = await foundCommunity(admin, { building });
    const unitId = await addUnit(admin, community.id, "1");
    const calls = everyMembersEndpoint(request, {
      communityId: community.id,
      unitId,
      userId: await userIdOf(admin),
    });

    const result = await statuses(calls);

    expect(result).toEqual(each(result, 403));
    const members = await (
      await admin.get(`/api/communities/${community.id}/members`)
    ).json();
    expect(members).toEqual([
      expect.objectContaining({ email: account.email, role: "admin" }),
    ]);
    await admin.dispose();
  });

  test("mieszkaniec widzi osoby tylko ze swojego lokalu i niczym nie zarządza", async ({
    playwright,
    baseURL,
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
    const resident = await signedInRequest(playwright, baseURL, account);
    const residentId = await addMember(
      admin,
      { request: resident, email: account.email },
      mailpit,
      community,
      { role: "resident", unitId: ownUnitId },
    );
    const inOwnUnit = everyMembersEndpoint(resident, {
      communityId: community.id,
      unitId: ownUnitId,
      userId: residentId,
    });
    const inOtherUnit = everyMembersEndpoint(resident, {
      communityId: community.id,
      unitId: otherUnitId,
      userId: residentId,
    });

    const ownUnit = await inOwnUnit["unitMembers.list"]();
    const refused = await statuses({
      ...only(inOwnUnit, [
        "communityMembers.invite",
        "unitMembers.invite",
        "members.list",
        "members.update",
        "members.remove",
        "unitMembers.update",
        "unitMembers.remove",
      ]),
      "unitMembers.list (lokal sąsiada)": inOtherUnit["unitMembers.list"],
    });

    expect(ownUnit.status()).toBe(200);
    expect(await ownUnit.json()).toEqual([
      expect.objectContaining({ userId: residentId, role: "resident" }),
    ]);
    expect(refused).toEqual(each(refused, 403));
    await admin.dispose();
    await resident.dispose();
  });

  test("pracownik nie widzi członków ani osób w lokalach i nikogo nie zaprasza", async ({
    playwright,
    baseURL,
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
    const unitId = await addUnit(admin, community.id, "1");
    const worker = await signedInRequest(playwright, baseURL, account);
    const workerId = await addMember(
      admin,
      { request: worker, email: account.email },
      mailpit,
      community,
      { role: "worker" },
    );

    const result = await statuses(
      everyMembersEndpoint(worker, {
        communityId: community.id,
        unitId,
        userId: workerId,
      }),
    );

    expect(result).toEqual(each(result, 403));
    await admin.dispose();
    await worker.dispose();
  });

  test("lokal i członek z innej wspólnoty to 404 dla administratora", async ({
    playwright,
    baseURL,
    mailpit,
    account,
    createAccount,
  }) => {
    const admin = await signedInRequest(playwright, baseURL, account);
    const mine = await foundCommunity(admin, { building });
    const other = await foundCommunity(admin, {
      name: "Druga wspólnota",
      building,
    });
    const otherUnitId = await addUnit(admin, other.id, "1");
    const person = await createAccount({ name: "Marek Nowicki" });
    const personRequest = await signedInRequest(playwright, baseURL, person);
    const member = { request: personRequest, email: person.email };
    const personId = await addMember(admin, member, mailpit, other, {
      role: "worker",
    });
    await addMember(admin, member, mailpit, other, {
      role: "resident",
      unitId: otherUnitId,
    });

    // Right community in the address, unit and person from the other one
    const result = await statuses(
      only(
        everyMembersEndpoint(admin, {
          communityId: mine.id,
          unitId: otherUnitId,
          userId: personId,
        }),
        [
          "unitMembers.invite",
          "members.update",
          "members.remove",
          "unitMembers.list",
          "unitMembers.update",
          "unitMembers.remove",
        ],
      ),
    );

    expect(result).toEqual(each(result, 404));
    await admin.dispose();
    await personRequest.dispose();
  });

  test("ostatniego administratora nie da się usunąć ani zdegradować – 409", async ({
    playwright,
    baseURL,
    mailpit,
    account,
    createAccount,
  }) => {
    const admin = await signedInRequest(playwright, baseURL, account);
    const community = await foundCommunity(admin);
    const adminId = await userIdOf(admin);
    const path = `/api/communities/${community.id}/members/${adminId}`;

    const demote = await admin.patch(path, { data: { role: "worker" } });
    const remove = await admin.delete(path);

    expect(demote.status()).toBe(409);
    expect(await demote.json()).toMatchObject({ code: "LAST_ADMIN" });
    expect(remove.status()).toBe(409);
    expect(await remove.json()).toMatchObject({ code: "LAST_ADMIN" });
    // With a second admin the first one may leave
    const second = await createAccount({ name: "Marek Nowicki" });
    const secondRequest = await signedInRequest(playwright, baseURL, second);
    await addMember(
      admin,
      { request: secondRequest, email: second.email },
      mailpit,
      community,
      { role: "admin" },
    );
    expect((await admin.delete(path)).status()).toBe(200);
    await admin.dispose();
    await secondRequest.dispose();
  });

  test.describe("bez sesji", () => {
    test.use({ storageState: SIGNED_OUT });

    test("odmawia z kodem 401", async ({ request }) => {
      const result = await statuses(
        everyMembersEndpoint(request, {
          communityId: "community_nie_ma",
          unitId: "unit_nie_ma",
          userId: "user_nie_ma",
        }),
      );

      expect(result).toEqual(each(result, 401));
    });
  });
});
