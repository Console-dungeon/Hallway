import type { BuildingDetail, StaircaseDetail } from "@hallway/shared";

/**
 * Where a common area belongs: the whole community (nothing), a building, or one
 * staircase of a building.
 */
export type LocationPlace =
  | { level: "community" }
  | { level: "building"; building: BuildingDetail }
  | {
      level: "staircase";
      building: BuildingDetail;
      staircase: StaircaseDetail;
    };

/** "Cała wspólnota", "Budynek Lipowa 12" or "Lipowa 12 · Klatka A". */
export function locationPlaceLabel(place: LocationPlace) {
  if (place.level === "community") return "Cała wspólnota";
  if (place.level === "building") return `Budynek ${place.building.name}`;
  return `${place.building.name} · Klatka ${place.staircase.name}`;
}

/** What deleting a common area takes it out of, e.g. "z klatki A w budynku Lipowa 12". */
export function locationPlaceFrom(place: LocationPlace) {
  if (place.level === "community") return "ze wspólnoty";
  if (place.level === "building") return `z budynku ${place.building.name}`;
  return `z klatki ${place.staircase.name} w budynku ${place.building.name}`;
}

/** The API only says CONFLICT; the message names the level where the name is taken. */
export function locationTakenMessage(place: LocationPlace) {
  const where = {
    community: "w tej wspólnocie",
    building: "w tym budynku",
    staircase: "w tej klatce",
  }[place.level];
  return `Część wspólna o tej nazwie już istnieje ${where}`;
}

/** Common areas of a building together with those of its staircases. */
export function buildingLocationCount(building: BuildingDetail) {
  return building.staircases.reduce(
    (sum, staircase) => sum + staircase.locations.length,
    building.locations.length,
  );
}
