import type { APIRequestContext } from "@playwright/test";

interface FoundedCommunity {
  id: string;
  name: string;
}

/**
 * Founds a community through the API as whoever `request` is signed in as; that account
 * becomes its admin. For tests where founding itself is not what is being tested.
 */
export async function foundCommunity(
  request: APIRequestContext,
  data: {
    name?: string;
    address?: string;
    building?: { name: string; staircases: string[] };
  } = {},
): Promise<FoundedCommunity> {
  const response = await request.post("/api/communities", {
    data: {
      name: "Wspólnota Mieszkaniowa Testowa 7",
      address: "ul. Testowa 7, 30-001 Kraków",
      ...data,
    },
  });
  if (!response.ok()) {
    throw new Error(`Founding a community failed: ${response.status()}`);
  }
  return (await response.json()) as FoundedCommunity;
}

/**
 * Adds a unit with the given number to the first staircase of the community's first
 * building (found the community with a building). Returns the new unit's id.
 */
export async function addUnit(
  request: APIRequestContext,
  communityId: string,
  number: string,
): Promise<string> {
  const path = `/api/communities/${communityId}`;
  const community = (await (await request.get(path)).json()) as {
    buildings: { staircases: { id: string }[] }[];
  };
  const staircase = community.buildings[0]?.staircases[0];
  if (!staircase) throw new Error("The community has no staircase");
  const response = await request.post(
    `${path}/staircases/${staircase.id}/units`,
    { data: { number, floor: null } },
  );
  if (!response.ok()) {
    throw new Error(`Adding a unit failed: ${response.status()}`);
  }
  return ((await response.json()) as { id: string }).id;
}
