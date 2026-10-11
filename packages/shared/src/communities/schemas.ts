import { z } from "zod";

import { communityActionSchema } from "./actions.js";
import { communityMemberRoleSchema } from "./roles.js";

/** Most staircases one building can get in the founding wizard. */
export const STAIRCASES_MAX = 20;

/** Step 1 of the founding wizard. */
export const communityDetailsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Podaj nazwę wspólnoty")
    .max(120, "Nazwa wspólnoty jest za długa"),
  address: z
    .string()
    .trim()
    .min(3, "Podaj adres wspólnoty")
    .max(200, "Adres jest za długi"),
});

export const buildingNameSchema = z
  .string()
  .trim()
  .min(1, "Podaj nazwę budynku")
  .max(120, "Nazwa budynku jest za długa");

export const staircaseNameSchema = z
  .string()
  .trim()
  .min(1, "Podaj nazwę klatki")
  .max(30, "Nazwa klatki jest za długa");

/** Staircases given together with a new building. */
export const staircaseNamesSchema = z
  .array(staircaseNameSchema)
  .max(STAIRCASES_MAX, `Budynek może mieć najwyżej ${STAIRCASES_MAX} klatek`)
  .refine(
    (names) => new Set(names).size === names.length,
    "Nazwy klatek nie mogą się powtarzać",
  );

/** Step 2 of the founding wizard; the step can be skipped. */
export const firstBuildingSchema = z.object({
  name: buildingNameSchema,
  staircases: staircaseNamesSchema.min(1, "Dodaj co najmniej jedną klatkę"),
});

export const createCommunitySchema = communityDetailsSchema.extend({
  building: firstBuildingSchema.optional(),
});

export const communitySummarySchema = z.object({
  id: z.string(),
  name: z.string(),
});

/** A community as its page shows it: the data, the structure and what the viewer may do. */
export const communityDetailSchema = communitySummarySchema.extend({
  address: z.string(),
  memberRole: communityMemberRoleSchema
    .nullable()
    .describe("The viewer's role in the community as a whole, if any"),
  hasUnits: z
    .boolean()
    .describe("Whether the viewer owns or lives in a unit of this community"),
  actions: z
    .array(communityActionSchema)
    .describe(
      "What the viewer may do here; the API checks it again on every call",
    ),
  buildings: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      staircases: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          units: z.array(
            z.object({
              id: z.string(),
              number: z.string(),
              floor: z.number().int().nullable(),
            }),
          ),
        }),
      ),
    }),
  ),
});

export type CommunityDetailsInput = z.infer<typeof communityDetailsSchema>;
export type FirstBuildingInput = z.infer<typeof firstBuildingSchema>;
export type CreateCommunityInput = z.infer<typeof createCommunitySchema>;
export type CommunitySummary = z.infer<typeof communitySummarySchema>;
export type CommunityDetail = z.infer<typeof communityDetailSchema>;
export type BuildingDetail = CommunityDetail["buildings"][number];
export type StaircaseDetail = BuildingDetail["staircases"][number];
export type UnitDetail = StaircaseDetail["units"][number];
