import { z } from "zod";

export const locationNameSchema = z
  .string()
  .trim()
  .min(1, "Podaj nazwę części wspólnej")
  .max(120, "Nazwa części wspólnej jest za długa");

/** The name form of a common area, used both to add and to rename one. */
export const locationSchema = z.object({ name: locationNameSchema });

/**
 * Where a new common area belongs: nothing for the whole community, `buildingId` for a
 * building, `buildingId` and `staircaseId` for one staircase of that building.
 */
export const locationLevelShape = {
  buildingId: z.string().optional(),
  staircaseId: z.string().optional(),
};

/** Cross-field rule of a level, for `z.object({ … }).superRefine(checkLocationLevel)`. */
export function checkLocationLevel(
  level: { buildingId?: string | undefined; staircaseId?: string | undefined },
  context: z.RefinementCtx,
) {
  if (level.staircaseId !== undefined && level.buildingId === undefined) {
    context.addIssue({
      code: "custom",
      path: ["buildingId"],
      message: "Klatka wymaga budynku",
    });
  }
}

/** A common area as the community page lists it. */
export const locationSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type LocationInput = z.infer<typeof locationSchema>;
export type LocationSummary = z.infer<typeof locationSummarySchema>;
