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
