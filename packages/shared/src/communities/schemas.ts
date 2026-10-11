import { z } from "zod";

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

/** Step 2 of the founding wizard; the step can be skipped. */
export const firstBuildingSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Podaj nazwę budynku")
    .max(120, "Nazwa budynku jest za długa"),
  staircases: z
    .array(z.string().trim().min(1).max(30))
    .min(1, "Dodaj co najmniej jedną klatkę")
    .max(STAIRCASES_MAX, `Budynek może mieć najwyżej ${STAIRCASES_MAX} klatek`)
    .refine(
      (names) => new Set(names).size === names.length,
      "Nazwy klatek nie mogą się powtarzać",
    ),
});

export const createCommunitySchema = communityDetailsSchema.extend({
  building: firstBuildingSchema.optional(),
});

export const communitySummarySchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type CommunityDetailsInput = z.infer<typeof communityDetailsSchema>;
export type FirstBuildingInput = z.infer<typeof firstBuildingSchema>;
export type CreateCommunityInput = z.infer<typeof createCommunitySchema>;
export type CommunitySummary = z.infer<typeof communitySummarySchema>;
