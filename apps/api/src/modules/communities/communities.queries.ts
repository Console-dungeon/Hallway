import {
  buildings,
  communities,
  communityMembers,
  type DbOrTx,
  staircases,
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

/** A building with its staircases, in the order given. */
export async function insertBuilding(
  db: DbOrTx,
  values: { communityId: string; name: string; staircases: string[] },
) {
  const [building] = await db
    .insert(buildings)
    .values({ communityId: values.communityId, name: values.name })
    .returning({ id: buildings.id });
  if (!building) throw new Error("Insert into buildings returned no row");

  await db
    .insert(staircases)
    .values(
      values.staircases.map((name) => ({ buildingId: building.id, name })),
    );
}
