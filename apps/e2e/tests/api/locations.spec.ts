import type { APIRequestContext, APIResponse } from "@playwright/test";

import { expect, test } from "../../fixtures";
import { signedInRequest } from "../../support/accounts";
import { addUnit, foundCommunity } from "../../support/communities";
import { addMember } from "../../support/invitations";
import { SIGNED_OUT } from "../../support/paths";

const building = { name: "Testowa 7", staircases: ["A"] };

interface Place {
  id: string;
  name: string;
  locations: { id: string; name: string }[];
}
interface Structure extends Place {
  buildings: (Place & { staircases: Place[] })[];
}

async function structureOf(request: APIRequestContext, communityId: string) {
  return (await (
    await request.get(`/api/communities/${communityId}`)
  ).json()) as Structure;
}

/** First building and its first staircase of a community founded with `building`. */
async function placesOf(request: APIRequestContext, communityId: string) {
  const structure = await structureOf(request, communityId);
  const firstBuilding = structure.buildings[0];
  const staircase = firstBuilding?.staircases[0];
  if (!firstBuilding || !staircase) throw new Error("No building/staircase");
  return { buildingId: firstBuilding.id, staircaseId: staircase.id };
}

async function addLocation(
  request: APIRequestContext,
  communityId: string,
  data: { name: string; buildingId?: string; staircaseId?: string },
) {
  const response = await request.post(
    `/api/communities/${communityId}/locations`,
    { data },
  );
  if (response.status() !== 201) {
    throw new Error(`Adding a common area failed: ${response.status()}`);
  }
  return ((await response.json()) as { id: string }).id;
}

/**
 * One request to every endpoint that changes common areas or the community itself, as
 * `request` is signed in. `locationId` is the common area changed or removed.
 */
function everyManagingEndpoint(
  request: APIRequestContext,
  { communityId, locationId }: { communityId: string; locationId: string },
) {
  const path = `/api/communities/${communityId}`;
  return {
    "locations.create": () =>
      request.post(`${path}/locations`, { data: { name: "Cudza pralnia" } }),
    "locations.update": () =>
      request.patch(`${path}/locations/${locationId}`, {
        data: { name: "Cudza nazwa" },
      }),
    "locations.remove": () => request.delete(`${path}/locations/${locationId}`),
    "communities.update": () =>
      request.patch(path, {
        data: { name: "Cudza wspólnota", address: "ul. Cudza 1" },
      }),
    "communities.remove": () => request.delete(path),
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

function each(result: Record<string, number>, status: number) {
  return Object.fromEntries(Object.keys(result).map((name) => [name, status]));
}

// `request` is the shared account, which belongs to no community: here it plays the
// outsider. Communities are founded by separate accounts, their admins.
test.describe("uprawnienia do części wspólnych i ustawień wspólnoty", () => {
  test("osoba spoza wspólnoty dostaje 403 na każdym endpoincie i niczego nie zmienia", async ({
    playwright,
    baseURL,
    request,
    account,
  }) => {
    const admin = await signedInRequest(playwright, baseURL, account);
    const community = await foundCommunity(admin);
    const locationId = await addLocation(admin, community.id, {
      name: "Parking",
    });

    const result = await statuses(
      everyManagingEndpoint(request, { communityId: community.id, locationId }),
    );

    expect(result).toEqual(each(result, 403));
    const after = await structureOf(admin, community.id);
    expect(after.name).toBe(community.name);
    expect(after.locations).toEqual([{ id: locationId, name: "Parking" }]);
    await admin.dispose();
  });

  const roles = {
    worker: "pracownik",
    owner: "właściciel",
    resident: "mieszkaniec",
  } as const;
  for (const [role, label] of Object.entries(roles) as [
    keyof typeof roles,
    string,
  ][]) {
    test(`${label} widzi części wspólne, ale dostaje 403 przy ich zmianie i przy zmianie wspólnoty`, async ({
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
      const locationId = await addLocation(admin, community.id, {
        name: "Parking",
      });
      const member = await signedInRequest(playwright, baseURL, account);
      await addMember(
        admin,
        { request: member, email: account.email },
        mailpit,
        community,
        role === "worker"
          ? { role }
          : { role, unitId: await addUnit(admin, community.id, "1") },
      );

      const view = await structureOf(member, community.id);
      const result = await statuses(
        everyManagingEndpoint(member, {
          communityId: community.id,
          locationId,
        }),
      );

      expect(view.locations).toEqual([{ id: locationId, name: "Parking" }]);
      expect(result).toEqual(each(result, 403));
      const after = await structureOf(admin, community.id);
      expect(after.name).toBe(community.name);
      expect(after.locations).toEqual([{ id: locationId, name: "Parking" }]);
      await admin.dispose();
      await member.dispose();
    });
  }

  test.describe("bez sesji", () => {
    test.use({ storageState: SIGNED_OUT });

    test("odmawia z kodem 401", async ({ request }) => {
      const result = await statuses(
        everyManagingEndpoint(request, {
          communityId: "community_nie_ma",
          locationId: "location_nie_ma",
        }),
      );

      expect(result).toEqual(each(result, 401));
    });
  });
});

test.describe("części wspólne w API", () => {
  test("część wspólna trafia na poziom wspólnoty, budynku albo klatki", async ({
    playwright,
    baseURL,
    account,
  }) => {
    const admin = await signedInRequest(playwright, baseURL, account);
    const community = await foundCommunity(admin, { building });
    const { buildingId, staircaseId } = await placesOf(admin, community.id);

    const parking = await addLocation(admin, community.id, { name: "Parking" });
    const laundry = await addLocation(admin, community.id, {
      name: "Pralnia",
      buildingId,
    });
    const lift = await addLocation(admin, community.id, {
      name: "Winda",
      buildingId,
      staircaseId,
    });

    const structure = await structureOf(admin, community.id);
    expect(structure.locations).toEqual([{ id: parking, name: "Parking" }]);
    expect(structure.buildings[0]?.locations).toEqual([
      { id: laundry, name: "Pralnia" },
    ]);
    expect(structure.buildings[0]?.staircases[0]?.locations).toEqual([
      { id: lift, name: "Winda" },
    ]);
    await admin.dispose();
  });

  test("klatka bez budynku to 400, budynek albo klatka z innej wspólnoty to 404", async ({
    playwright,
    baseURL,
    account,
  }) => {
    const admin = await signedInRequest(playwright, baseURL, account);
    const mine = await foundCommunity(admin, { building });
    const other = await foundCommunity(admin, {
      name: "Druga wspólnota",
      building: { name: "Obcy", staircases: ["A", "B"] },
    });
    const own = await placesOf(admin, mine.id);
    const foreign = await placesOf(admin, other.id);
    const foreignLocation = await addLocation(admin, other.id, {
      name: "Parking",
    });
    const path = `/api/communities/${mine.id}/locations`;

    const result = await statuses({
      "klatka bez budynku": () =>
        admin.post(path, {
          data: { name: "Winda", staircaseId: own.staircaseId },
        }),
      "budynek z innej wspólnoty": () =>
        admin.post(path, {
          data: { name: "Winda", buildingId: foreign.buildingId },
        }),
      "klatka z innej wspólnoty": () =>
        admin.post(path, {
          data: {
            name: "Winda",
            buildingId: own.buildingId,
            staircaseId: foreign.staircaseId,
          },
        }),
      "nieistniejący budynek": () =>
        admin.post(path, {
          data: { name: "Winda", buildingId: "building_nie_ma" },
        }),
      "zmiana części wspólnej z innej wspólnoty": () =>
        admin.patch(`${path}/${foreignLocation}`, {
          data: { name: "Przejęty parking" },
        }),
      "usunięcie części wspólnej z innej wspólnoty": () =>
        admin.delete(`${path}/${foreignLocation}`),
      "pusta nazwa": () => admin.post(path, { data: { name: " " } }),
    });

    expect(result).toEqual({
      "klatka bez budynku": 400,
      "budynek z innej wspólnoty": 404,
      "klatka z innej wspólnoty": 404,
      "nieistniejący budynek": 404,
      "zmiana części wspólnej z innej wspólnoty": 404,
      "usunięcie części wspólnej z innej wspólnoty": 404,
      "pusta nazwa": 400,
    });
    expect((await structureOf(admin, mine.id)).locations).toEqual([]);
    expect((await structureOf(admin, other.id)).locations).toEqual([
      { id: foreignLocation, name: "Parking" },
    ]);
    await admin.dispose();
  });

  test("klatka z innego budynku tej samej wspólnoty to 404", async ({
    playwright,
    baseURL,
    account,
  }) => {
    const admin = await signedInRequest(playwright, baseURL, account);
    const community = await foundCommunity(admin, { building });
    const second = await admin.post(
      `/api/communities/${community.id}/buildings`,
      { data: { name: "Testowa 9", staircases: ["A"] } },
    );
    expect(second.ok()).toBe(true);
    const structure = await structureOf(admin, community.id);
    const [first, other] = structure.buildings;

    const response = await admin.post(
      `/api/communities/${community.id}/locations`,
      {
        data: {
          name: "Winda",
          buildingId: first?.id,
          staircaseId: other?.staircases[0]?.id,
        },
      },
    );

    expect(response.status()).toBe(404);
    await admin.dispose();
  });

  test("ta sama nazwa na tym samym poziomie to 409, na innym poziomie jest dozwolona", async ({
    playwright,
    baseURL,
    account,
  }) => {
    const admin = await signedInRequest(playwright, baseURL, account);
    const community = await foundCommunity(admin, { building });
    const { buildingId, staircaseId } = await placesOf(admin, community.id);
    const path = `/api/communities/${community.id}/locations`;
    const levels = {
      wspólnota: {},
      budynek: { buildingId },
      klatka: { buildingId, staircaseId },
    };
    const ids: Record<string, string> = {};
    for (const [level, place] of Object.entries(levels)) {
      ids[level] = await addLocation(admin, community.id, {
        name: "Komórka",
        ...place,
      });
    }

    const duplicates = await statuses(
      Object.fromEntries(
        Object.entries(levels).map(([level, place]) => [
          level,
          () => admin.post(path, { data: { name: "Komórka", ...place } }),
        ]),
      ),
    );
    const other = await addLocation(admin, community.id, {
      name: "Winda",
      buildingId,
      staircaseId,
    });
    const rename = await admin.patch(`${path}/${other}`, {
      data: { name: "Komórka" },
    });
    const sameName = await admin.patch(`${path}/${ids.klatka}`, {
      data: { name: "Komórka" },
    });

    expect(duplicates).toEqual(each(duplicates, 409));
    expect(rename.status()).toBe(409);
    expect(await rename.json()).toMatchObject({ code: "CONFLICT" });
    // Keeping its own name is not a clash with itself
    expect(sameName.status()).toBe(200);
    await admin.dispose();
  });

  test("usunięcie klatki albo budynku usuwa ich części wspólne", async ({
    playwright,
    baseURL,
    account,
  }) => {
    const admin = await signedInRequest(playwright, baseURL, account);
    const community = await foundCommunity(admin, {
      building: { name: "Testowa 7", staircases: ["A", "B"] },
    });
    const path = `/api/communities/${community.id}`;
    const structure = await structureOf(admin, community.id);
    const firstBuilding = structure.buildings[0];
    const [staircaseA, staircaseB] = firstBuilding?.staircases ?? [];
    if (!firstBuilding || !staircaseA || !staircaseB) throw new Error();
    const buildingId = firstBuilding.id;
    const lift = await addLocation(admin, community.id, {
      name: "Winda",
      buildingId,
      staircaseId: staircaseA.id,
    });
    await addLocation(admin, community.id, {
      name: "Wózkownia",
      buildingId,
      staircaseId: staircaseB.id,
    });
    await addLocation(admin, community.id, { name: "Pralnia", buildingId });
    const parking = await addLocation(admin, community.id, {
      name: "Parking",
    });

    const deleteStaircase = await admin.delete(
      `${path}/staircases/${staircaseA.id}`,
    );

    expect(deleteStaircase.ok()).toBe(true);
    const afterStaircase = await structureOf(admin, community.id);
    expect(afterStaircase.buildings[0]?.staircases).toEqual([
      expect.objectContaining({
        id: staircaseB.id,
        locations: [expect.objectContaining({ name: "Wózkownia" })],
      }),
    ]);
    expect(afterStaircase.buildings[0]?.locations).toEqual([
      expect.objectContaining({ name: "Pralnia" }),
    ]);
    expect(
      (
        await admin.patch(`${path}/locations/${lift}`, { data: { name: "X" } })
      ).status(),
    ).toBe(404);
    const deleteBuilding = await admin.delete(
      `${path}/buildings/${buildingId}`,
    );

    expect(deleteBuilding.ok()).toBe(true);
    const afterBuilding = await structureOf(admin, community.id);
    expect(afterBuilding.buildings).toEqual([]);
    expect(afterBuilding.locations).toEqual([{ id: parking, name: "Parking" }]);
    await admin.dispose();
  });
});
