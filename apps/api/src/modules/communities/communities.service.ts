import type { Database } from "@hallway/db";
import type { CommunityDetail, CreateCommunityInput } from "@hallway/shared";

import {
  allowedActions,
  type CommunityAccess,
} from "../../policies/community.js";
import {
  insertBuilding,
  listStructure,
} from "../structure/structure.queries.js";
import {
  findActiveCommunity,
  findMemberRole,
  insertCommunity,
  insertCommunityMember,
  listUnitIdsOf,
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

/**
 * What the user is in the community, for the permission rules; null when the community
 * does not exist or has been removed.
 */
export async function loadCommunityAccess(
  db: Database,
  communityId: string,
  user: { id: string; role?: string | null | undefined },
): Promise<CommunityAccess | null> {
  const [community, memberRole, unitIds] = await Promise.all([
    findActiveCommunity(db, communityId),
    findMemberRole(db, communityId, user.id),
    listUnitIdsOf(db, communityId, user.id),
  ]);
  if (!community) return null;

  return { isSuperadmin: user.role === "superadmin", memberRole, unitIds };
}

/** The community page: its data, its structure and what this viewer may do there. */
export async function getCommunityDetail(
  db: Database,
  communityId: string,
  access: CommunityAccess,
): Promise<CommunityDetail | null> {
  const [community, buildings] = await Promise.all([
    findActiveCommunity(db, communityId),
    listStructure(db, communityId),
  ]);
  if (!community) return null;

  // Unit numbers are text ("2", "10", "12A"): order them the way people count
  for (const building of buildings) {
    for (const staircase of building.staircases) {
      staircase.units.sort((a, b) =>
        a.number.localeCompare(b.number, "pl", { numeric: true }),
      );
    }
  }

  return {
    ...community,
    memberRole: access.memberRole,
    hasUnits: access.unitIds.length > 0,
    actions: allowedActions(access),
    buildings,
  };
}
