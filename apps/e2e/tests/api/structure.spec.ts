import { createDb, sql } from "@hallway/db";

import { expect, test } from "../../fixtures";
import { signedInRequest } from "../../support/accounts";
import { foundCommunity } from "../../support/communities";
import { SIGNED_OUT } from "../../support/paths";

// `request` is the shared account, which belongs to no community: here it plays the
// outsider. The community is founded by a separate account, its admin.
test.describe("uprawnienia do struktury wspólnoty", () => {
  test("osoba spoza wspólnoty dostaje odmowę 403 i nie zmienia struktury", async ({
    playwright,
    baseURL,
    request,
    account,
    communityPage,
    welcomePage,
  }) => {
    const admin = await signedInRequest(playwright, baseURL, account);
    const community = await foundCommunity(admin, {
      building: { name: "Testowa 7", staircases: ["A"] },
    });
    const path = `/api/communities/${community.id}`;

    const view = await request.get(path);
    const add = await request.post(`${path}/buildings`, {
      data: { name: "Cudzy budynek", staircases: [] },
    });

    expect(view.status()).toBe(403);
    expect(add.status()).toBe(403);
    expect(await add.json()).toMatchObject({ code: "FORBIDDEN" });
    const structure = await (await admin.get(path)).json();
    expect(structure.buildings).toHaveLength(1);
    // In the browser the outsider never reaches the page: an account that belongs
    // nowhere is sent back to its first steps
    await communityPage.goto(community.id);
    await welcomePage.expectOpen();
    await admin.dispose();
  });

  test("nieistniejąca wspólnota to 404", async ({ request }) => {
    const response = await request.get("/api/communities/community_nie_ma");

    expect(response.status()).toBe(404);
    expect(await response.json()).toMatchObject({ code: "NOT_FOUND" });
  });

  test("budynek z innej wspólnoty jest niewidoczny dla jej administratora", async ({
    playwright,
    baseURL,
    account,
  }) => {
    const admin = await signedInRequest(playwright, baseURL, account);
    const mine = await foundCommunity(admin);
    const other = await foundCommunity(admin, {
      name: "Druga wspólnota",
      building: { name: "Obcy", staircases: ["A"] },
    });
    const otherBuilding = (
      await (await admin.get(`/api/communities/${other.id}`)).json()
    ).buildings[0];

    // Right community in the address, building id from another one
    const response = await admin.delete(
      `/api/communities/${mine.id}/buildings/${otherBuilding.id}`,
    );

    expect(response.status()).toBe(404);
    await admin.dispose();
  });

  test("lokalu z przypisaną osobą nie da się usunąć, także razem z budynkiem", async ({
    playwright,
    baseURL,
    account,
  }) => {
    const admin = await signedInRequest(playwright, baseURL, account);
    const community = await foundCommunity(admin, {
      building: { name: "Testowa 7", staircases: ["A"] },
    });
    const path = `/api/communities/${community.id}`;
    const building = (await (await admin.get(path)).json()).buildings[0];
    const staircase = building.staircases[0];
    const unit = await (
      await admin.post(`${path}/staircases/${staircase.id}/units`, {
        data: { number: "1", floor: null },
      })
    ).json();
    // Assigning people to units has no endpoint yet, so the row is written directly
    const me = await (await admin.get("/api/me")).json();
    const { db, pool } = createDb(process.env.DATABASE_URL ?? "");
    await db.execute(
      sql`insert into unit_members (unit_id, user_id, role) values (${unit.id}, ${me.user.id}, 'owner')`,
    );
    await pool.end();

    const deleteUnit = await admin.delete(`${path}/units/${unit.id}`);
    const deleteBuilding = await admin.delete(
      `${path}/buildings/${building.id}`,
    );

    expect(deleteUnit.status()).toBe(409);
    expect(await deleteUnit.json()).toMatchObject({ code: "UNIT_HAS_MEMBERS" });
    expect(deleteBuilding.status()).toBe(409);
    await admin.dispose();
  });

  test.describe("bez sesji", () => {
    test.use({ storageState: SIGNED_OUT });

    test("odmawia z kodem 401", async ({ request }) => {
      const response = await request.get("/api/communities/community_nie_ma");

      expect(response.status()).toBe(401);
    });
  });
});
