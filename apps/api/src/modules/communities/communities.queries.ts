import {
  and,
  buildings,
  communities,
  communityMembers,
  type DbOrTx,
  eq,
  isNull,
  staircases,
  unitMembers,
  units,
} from "@hallway/db";
import type { CommunityMemberRole } from "@hallway/shared";

export async function insertCommunity(
  db: DbOrTx,
  values: { name: string; address: string; createdBy: string },
) {
  const [community] = await db
    .insert(communities)
    .values(values)
    .returning({ id: communities.id, name: communities.name });
  if (!community) throw new Error("Insert into communities returned no row");
  return community;
}

export async function insertCommunityMember(
  db: DbOrTx,
  values: { communityId: string; userId: string; role: CommunityMemberRole },
) {
  await db.insert(communityMembers).values(values);
}

/** A community that exists and has not been removed. */
export async function findActiveCommunity(db: DbOrTx, communityId: string) {
  const [community] = await db
    .select({
      id: communities.id,
      name: communities.name,
      address: communities.address,
    })
    .from(communities)
    .where(
      and(eq(communities.id, communityId), isNull(communities.archivedAt)),
    );
  return community;
}

export async function updateCommunity(
  db: DbOrTx,
  communityId: string,
  values: { name: string; address: string },
) {
  const [community] = await db
    .update(communities)
    .set(values)
    .where(and(eq(communities.id, communityId), isNull(communities.archivedAt)))
    .returning({
      id: communities.id,
      name: communities.name,
      address: communities.address,
    });
  return community;
}

/** Soft delete: the row and its data stay, every query that shows communities skips it. */
export async function archiveCommunity(db: DbOrTx, communityId: string) {
  const [community] = await db
    .update(communities)
    .set({ archivedAt: new Date() })
    .where(and(eq(communities.id, communityId), isNull(communities.archivedAt)))
    .returning({ id: communities.id });
  return community;
}

export async function findMemberRole(
  db: DbOrTx,
  communityId: string,
  userId: string,
) {
  const [member] = await db
    .select({ role: communityMembers.role })
    .from(communityMembers)
    .where(
      and(
        eq(communityMembers.communityId, communityId),
        eq(communityMembers.userId, userId),
      ),
    );
  return member?.role ?? null;
}

/** Units of the community the user owns or lives in. */
export async function listUnitIdsOf(
  db: DbOrTx,
  communityId: string,
  userId: string,
) {
  const rows = await db
    .select({ id: units.id })
    .from(unitMembers)
    .innerJoin(units, eq(units.id, unitMembers.unitId))
    .innerJoin(staircases, eq(staircases.id, units.staircaseId))
    .innerJoin(buildings, eq(buildings.id, staircases.buildingId))
    .where(
      and(
        eq(unitMembers.userId, userId),
        eq(buildings.communityId, communityId),
      ),
    );
  return rows.map((row) => row.id);
}
