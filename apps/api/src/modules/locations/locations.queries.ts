import {
  and,
  asc,
  type Database,
  type DbOrTx,
  eq,
  locations,
} from "@hallway/db";

/** All common areas of a community with their level, sorted by name. */
export function listLocations(db: Database, communityId: string) {
  return db
    .select({
      id: locations.id,
      name: locations.name,
      buildingId: locations.buildingId,
      staircaseId: locations.staircaseId,
    })
    .from(locations)
    .where(eq(locations.communityId, communityId))
    .orderBy(asc(locations.name));
}

/** A common area of this community; an id from another community gives nothing. */
export async function findLocation(
  db: DbOrTx,
  communityId: string,
  locationId: string,
) {
  const [location] = await db
    .select({ id: locations.id })
    .from(locations)
    .where(
      and(eq(locations.id, locationId), eq(locations.communityId, communityId)),
    );
  return location;
}

export async function insertLocation(
  db: DbOrTx,
  values: {
    communityId: string;
    buildingId: string | null;
    staircaseId: string | null;
    name: string;
  },
) {
  const [location] = await db
    .insert(locations)
    .values(values)
    .returning({ id: locations.id });
  if (!location) throw new Error("Insert into locations returned no row");
  return location;
}

export function renameLocation(db: DbOrTx, locationId: string, name: string) {
  return db.update(locations).set({ name }).where(eq(locations.id, locationId));
}

export function deleteLocation(db: DbOrTx, locationId: string) {
  return db.delete(locations).where(eq(locations.id, locationId));
}
