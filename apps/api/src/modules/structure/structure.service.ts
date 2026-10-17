import {
  type Database,
  isForeignKeyViolation,
  isUniqueViolation,
} from "@hallway/db";
import type {
  BuildingInput,
  UnitInput,
  UnitSeriesInput,
} from "@hallway/shared";

import * as queries from "./structure.queries.js";

/** What can go wrong in the structure of a community; procedures turn it into contract errors. */
export class StructureError extends Error {
  constructor(readonly code: "NOT_FOUND" | "CONFLICT" | "UNIT_HAS_MEMBERS") {
    super(code);
  }
}

/** A name or number that is already taken breaks a UNIQUE constraint; report it as a conflict. */
async function uniqueOrConflict<T>(write: () => Promise<T>) {
  try {
    return await write();
  } catch (error) {
    if (isUniqueViolation(error)) throw new StructureError("CONFLICT");
    throw error;
  }
}

/**
 * Units with people assigned must not disappear, on their own or with their staircase or
 * building. Checked first for a clear answer; the RESTRICT key in the database is the
 * second line of defence.
 */
async function deleteUnlessOccupied(
  db: Database,
  scope: Parameters<typeof queries.countUnitMembers>[1],
  remove: () => Promise<unknown>,
) {
  if ((await queries.countUnitMembers(db, scope)) > 0) {
    throw new StructureError("UNIT_HAS_MEMBERS");
  }
  try {
    await remove();
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      throw new StructureError("UNIT_HAS_MEMBERS");
    }
    throw error;
  }
}

async function buildingOf(
  db: Database,
  communityId: string,
  buildingId: string,
) {
  const building = await queries.findBuilding(db, communityId, buildingId);
  if (!building) throw new StructureError("NOT_FOUND");
  return building;
}

async function staircaseOf(
  db: Database,
  communityId: string,
  staircaseId: string,
) {
  const staircase = await queries.findStaircase(db, communityId, staircaseId);
  if (!staircase) throw new StructureError("NOT_FOUND");
  return staircase;
}

async function unitOf(db: Database, communityId: string, unitId: string) {
  const unit = await queries.findUnit(db, communityId, unitId);
  if (!unit) throw new StructureError("NOT_FOUND");
  return unit;
}

export function createBuilding(
  db: Database,
  communityId: string,
  input: BuildingInput,
) {
  return uniqueOrConflict(() =>
    db.transaction((tx) =>
      queries.insertBuilding(tx, { communityId, ...input }),
    ),
  );
}

export async function renameBuilding(
  db: Database,
  communityId: string,
  buildingId: string,
  name: string,
) {
  const building = await buildingOf(db, communityId, buildingId);
  await uniqueOrConflict(() => queries.renameBuilding(db, building.id, name));
  return building;
}

export async function deleteBuilding(
  db: Database,
  communityId: string,
  buildingId: string,
) {
  const building = await buildingOf(db, communityId, buildingId);
  await deleteUnlessOccupied(db, { buildingId: building.id }, () =>
    queries.deleteBuilding(db, building.id),
  );
  return building;
}

export async function createStaircase(
  db: Database,
  communityId: string,
  buildingId: string,
  name: string,
) {
  const building = await buildingOf(db, communityId, buildingId);
  return uniqueOrConflict(() =>
    queries.insertStaircase(db, { buildingId: building.id, name }),
  );
}

export async function renameStaircase(
  db: Database,
  communityId: string,
  staircaseId: string,
  name: string,
) {
  const staircase = await staircaseOf(db, communityId, staircaseId);
  await uniqueOrConflict(() => queries.renameStaircase(db, staircase.id, name));
  return staircase;
}

export async function deleteStaircase(
  db: Database,
  communityId: string,
  staircaseId: string,
) {
  const staircase = await staircaseOf(db, communityId, staircaseId);
  await deleteUnlessOccupied(db, { staircaseId: staircase.id }, () =>
    queries.deleteStaircase(db, staircase.id),
  );
  return staircase;
}

export async function createUnit(
  db: Database,
  communityId: string,
  staircaseId: string,
  input: UnitInput,
) {
  const staircase = await staircaseOf(db, communityId, staircaseId);
  return uniqueOrConflict(() =>
    queries.insertUnit(db, { staircaseId: staircase.id, ...input }),
  );
}

/** Adds units numbered from…to; numbers already in the staircase are left as they are. */
export async function createUnitSeries(
  db: Database,
  communityId: string,
  staircaseId: string,
  series: UnitSeriesInput,
) {
  const staircase = await staircaseOf(db, communityId, staircaseId);
  const numbers = Array.from(
    { length: series.to - series.from + 1 },
    (_, index) => String(series.from + index),
  );
  const created = await queries.insertUnitsSkippingExisting(
    db,
    staircase.id,
    numbers,
  );
  return { created, skipped: numbers.length - created };
}

export async function updateUnit(
  db: Database,
  communityId: string,
  unitId: string,
  input: UnitInput,
) {
  const unit = await unitOf(db, communityId, unitId);
  await uniqueOrConflict(() => queries.updateUnit(db, unit.id, input));
  return unit;
}

export async function deleteUnit(
  db: Database,
  communityId: string,
  unitId: string,
) {
  const unit = await unitOf(db, communityId, unitId);
  await deleteUnlessOccupied(db, { unitId: unit.id }, () =>
    queries.deleteUnit(db, unit.id),
  );
  return unit;
}
