import { type Database, isUniqueViolation } from "@hallway/db";

import { findBuilding, findStaircase } from "../structure/structure.queries.js";
import * as queries from "./locations.queries.js";

/** What can go wrong with common areas; procedures turn it into contract errors. */
export class LocationsError extends Error {
  constructor(readonly code: "NOT_FOUND" | "CONFLICT") {
    super(code);
  }
}

/** A name already used on the same level breaks a UNIQUE constraint; report it as a conflict. */
async function uniqueOrConflict<T>(write: () => Promise<T>) {
  try {
    return await write();
  } catch (error) {
    if (isUniqueViolation(error)) throw new LocationsError("CONFLICT");
    throw error;
  }
}

async function locationOf(
  db: Database,
  communityId: string,
  locationId: string,
) {
  const location = await queries.findLocation(db, communityId, locationId);
  if (!location) throw new LocationsError("NOT_FOUND");
  return location;
}

/**
 * The level of a new common area, checked against the community: the building must be
 * in it, and the staircase in that building. Anything else is a 404.
 */
async function levelOf(
  db: Database,
  communityId: string,
  level: { buildingId?: string | undefined; staircaseId?: string | undefined },
) {
  if (level.buildingId === undefined) {
    // The contract already refuses a staircase without its building
    return { buildingId: null, staircaseId: null };
  }
  const building = await findBuilding(db, communityId, level.buildingId);
  if (!building) throw new LocationsError("NOT_FOUND");
  if (level.staircaseId === undefined) {
    return { buildingId: building.id, staircaseId: null };
  }
  const staircase = await findStaircase(db, communityId, level.staircaseId);
  if (!staircase || staircase.buildingId !== building.id) {
    throw new LocationsError("NOT_FOUND");
  }
  return { buildingId: building.id, staircaseId: staircase.id };
}

export async function createLocation(
  db: Database,
  communityId: string,
  input: {
    name: string;
    buildingId?: string | undefined;
    staircaseId?: string | undefined;
  },
) {
  const level = await levelOf(db, communityId, input);
  return uniqueOrConflict(() =>
    queries.insertLocation(db, { communityId, ...level, name: input.name }),
  );
}

export async function renameLocation(
  db: Database,
  communityId: string,
  locationId: string,
  name: string,
) {
  const location = await locationOf(db, communityId, locationId);
  await uniqueOrConflict(() => queries.renameLocation(db, location.id, name));
  return location;
}

export async function deleteLocation(
  db: Database,
  communityId: string,
  locationId: string,
) {
  const location = await locationOf(db, communityId, locationId);
  await queries.deleteLocation(db, location.id);
  return location;
}
