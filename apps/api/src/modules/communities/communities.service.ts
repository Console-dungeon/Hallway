import type { Database } from "@hallway/db";
import type { CreateCommunityInput } from "@hallway/shared";

import {
  insertBuilding,
  insertCommunity,
  insertCommunityMember,
} from "./communities.queries.js";

/**
 * Founds a community: the founder becomes its admin, and the first building with its
 * staircases is created along, if given. All or nothing.
 */
export function createCommunity(
  db: Database,
  founderId: string,
  input: CreateCommunityInput,
) {
  return db.transaction(async (tx) => {
    const community = await insertCommunity(tx, {
      name: input.name,
      address: input.address,
      createdBy: founderId,
    });
    await insertCommunityMember(tx, {
      communityId: community.id,
      userId: founderId,
      role: "admin",
    });
    if (input.building) {
      await insertBuilding(tx, {
        communityId: community.id,
        ...input.building,
      });
    }
    return community;
  });
}
