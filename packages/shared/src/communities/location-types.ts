import { z } from "zod";

/** Kinds of common areas a ticket can be about. */
export const locationTypes = [
  "stairwell",
  "elevator",
  "entrance",
  "basement",
  "attic",
  "parking",
  "courtyard",
  "garbage_area",
  "other",
] as const;
export const locationTypeSchema = z.enum(locationTypes);
export type LocationType = z.infer<typeof locationTypeSchema>;

/** Polish names shown in the interface. */
export const locationTypeLabels: Record<LocationType, string> = {
  stairwell: "Klatka schodowa",
  elevator: "Winda",
  entrance: "Wejście",
  basement: "Piwnica",
  attic: "Strych",
  parking: "Parking",
  courtyard: "Podwórko",
  garbage_area: "Śmietnik",
  other: "Inne",
};
