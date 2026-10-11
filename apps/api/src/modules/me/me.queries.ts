import {
  buildings,
  communities,
  communityMembers,
  type Database,
  eq,
  staircases,
  unitMembers,
  units,
} from "@hallway/db";

/** Communities where the user is an admin, worker or contractor. */
export function listCommunitiesOf(db: Database, userId: string) {
  return db
    .select({
      id: communities.id,
      name: communities.name,
      role: communityMembers.role,
    })
    .from(communityMembers)
    .innerJoin(communities, eq(communities.id, communityMembers.communityId))
    .where(eq(communityMembers.userId, userId))
    .orderBy(communities.name);
}

/** Units the user owns or lives in, with where each one is. */
export function listUnitsOf(db: Database, userId: string) {
  return db
    .select({
      id: units.id,
      number: units.number,
      role: unitMembers.role,
      staircaseName: staircases.name,
      buildingName: buildings.name,
      communityId: communities.id,
      communityName: communities.name,
    })
    .from(unitMembers)
    .innerJoin(units, eq(units.id, unitMembers.unitId))
    .innerJoin(staircases, eq(staircases.id, units.staircaseId))
    .innerJoin(buildings, eq(buildings.id, staircases.buildingId))
    .innerJoin(communities, eq(communities.id, buildings.communityId))
    .where(eq(unitMembers.userId, userId))
    .orderBy(communities.name, buildings.name, staircases.name, units.number);
}
