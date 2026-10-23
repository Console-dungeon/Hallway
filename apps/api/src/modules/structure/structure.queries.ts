import {
  and,
  asc,
  buildings,
  count,
  type Database,
  type DbOrTx,
  eq,
  staircases,
  unitMembers,
  units,
} from "@hallway/db";

/** Buildings of a community with their staircases and units, each level sorted by name. */
export function listStructure(db: Database, communityId: string) {
  return db.query.buildings.findMany({
    where: eq(buildings.communityId, communityId),
    columns: { id: true, name: true },
    orderBy: asc(buildings.name),
    with: {
      staircases: {
        columns: { id: true, name: true },
        orderBy: asc(staircases.name),
        with: {
          units: { columns: { id: true, number: true, floor: true } },
        },
      },
    },
  });
}

// Lookups below take the community as well as the id: an id from another community
// must behave as if it did not exist.

export async function findBuilding(
  db: DbOrTx,
  communityId: string,
  buildingId: string,
) {
  const [building] = await db
    .select({ id: buildings.id })
    .from(buildings)
    .where(
      and(eq(buildings.id, buildingId), eq(buildings.communityId, communityId)),
    );
  return building;
}

export async function findStaircase(
  db: DbOrTx,
  communityId: string,
  staircaseId: string,
) {
  const [staircase] = await db
    .select({ id: staircases.id, buildingId: staircases.buildingId })
    .from(staircases)
    .innerJoin(buildings, eq(buildings.id, staircases.buildingId))
    .where(
      and(
        eq(staircases.id, staircaseId),
        eq(buildings.communityId, communityId),
      ),
    );
  return staircase;
}

export async function findUnit(
  db: DbOrTx,
  communityId: string,
  unitId: string,
) {
  const [unit] = await db
    .select({ id: units.id })
    .from(units)
    .innerJoin(staircases, eq(staircases.id, units.staircaseId))
    .innerJoin(buildings, eq(buildings.id, staircases.buildingId))
    .where(and(eq(units.id, unitId), eq(buildings.communityId, communityId)));
  return unit;
}

/** How many people are assigned to units under a building, a staircase or one unit. */
export async function countUnitMembers(
  db: DbOrTx,
  scope: { buildingId: string } | { staircaseId: string } | { unitId: string },
) {
  const where =
    "buildingId" in scope
      ? eq(staircases.buildingId, scope.buildingId)
      : "staircaseId" in scope
        ? eq(units.staircaseId, scope.staircaseId)
        : eq(units.id, scope.unitId);
  const [row] = await db
    .select({ members: count() })
    .from(unitMembers)
    .innerJoin(units, eq(units.id, unitMembers.unitId))
    .innerJoin(staircases, eq(staircases.id, units.staircaseId))
    .where(where);
  return row?.members ?? 0;
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

  if (values.staircases.length > 0) {
    await db
      .insert(staircases)
      .values(
        values.staircases.map((name) => ({ buildingId: building.id, name })),
      );
  }
  return building;
}

export function renameBuilding(db: DbOrTx, buildingId: string, name: string) {
  return db.update(buildings).set({ name }).where(eq(buildings.id, buildingId));
}

export function deleteBuilding(db: DbOrTx, buildingId: string) {
  return db.delete(buildings).where(eq(buildings.id, buildingId));
}

export async function insertStaircase(
  db: DbOrTx,
  values: { buildingId: string; name: string },
) {
  const [staircase] = await db
    .insert(staircases)
    .values(values)
    .returning({ id: staircases.id });
  if (!staircase) throw new Error("Insert into staircases returned no row");
  return staircase;
}

export function renameStaircase(db: DbOrTx, staircaseId: string, name: string) {
  return db
    .update(staircases)
    .set({ name })
    .where(eq(staircases.id, staircaseId));
}

export function deleteStaircase(db: DbOrTx, staircaseId: string) {
  return db.delete(staircases).where(eq(staircases.id, staircaseId));
}

export async function insertUnit(
  db: DbOrTx,
  values: { staircaseId: string; number: string; floor: number | null },
) {
  const [unit] = await db
    .insert(units)
    .values(values)
    .returning({ id: units.id });
  if (!unit) throw new Error("Insert into units returned no row");
  return unit;
}

/** Adds the numbers that are still free in the staircase; returns how many were added. */
export async function insertUnitsSkippingExisting(
  db: DbOrTx,
  staircaseId: string,
  numbers: string[],
) {
  const added = await db
    .insert(units)
    .values(numbers.map((number) => ({ staircaseId, number })))
    .onConflictDoNothing({ target: [units.staircaseId, units.number] })
    .returning({ id: units.id });
  return added.length;
}

export function updateUnit(
  db: DbOrTx,
  unitId: string,
  values: { number: string; floor: number | null },
) {
  return db.update(units).set(values).where(eq(units.id, unitId));
}

export function deleteUnit(db: DbOrTx, unitId: string) {
  return db.delete(units).where(eq(units.id, unitId));
}
