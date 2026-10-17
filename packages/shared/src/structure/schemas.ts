import { z } from "zod";

import {
  buildingNameSchema,
  staircaseNameSchema,
  staircaseNamesSchema,
} from "../communities/schemas.js";

/** Most units one series can add at once. */
export const UNIT_SERIES_MAX = 200;

/** A new building; staircases can be given right away or added later. */
export const buildingSchema = z.object({
  name: buildingNameSchema,
  staircases: staircaseNamesSchema,
});

export const buildingNameFormSchema = z.object({ name: buildingNameSchema });

export const staircaseSchema = z.object({ name: staircaseNameSchema });

export const unitSchema = z.object({
  // Text, because unit numbers look like "12A"
  number: z
    .string()
    .trim()
    .min(1, "Podaj numer lokalu")
    .max(10, "Numer lokalu jest za długi"),
  floor: z
    .number("Piętro musi być liczbą")
    .int("Piętro musi być liczbą całkowitą")
    .min(-5, "Piętro nie może być niższe niż -5")
    .max(200, "Piętro nie może być wyższe niż 200")
    .nullable(),
});

const seriesNumber = z
  .number("Podaj numer")
  .int("Numer musi być liczbą całkowitą")
  .min(1, "Numer musi być większy od zera")
  .max(9999, "Numer jest za duży");

/** Fields of a series of units numbered `from`…`to`; check them with `checkUnitSeries`. */
export const unitSeriesShape = { from: seriesNumber, to: seriesNumber };

/** Cross-field rules of a unit series, for `z.object({ … }).superRefine(checkUnitSeries)`. */
export function checkUnitSeries(
  series: { from: number; to: number },
  context: z.RefinementCtx,
) {
  if (series.to < series.from) {
    context.addIssue({
      code: "custom",
      path: ["to"],
      message: "Numer końcowy nie może być mniejszy od początkowego",
    });
  } else if (series.to - series.from + 1 > UNIT_SERIES_MAX) {
    context.addIssue({
      code: "custom",
      path: ["to"],
      message: `Jednorazowo można dodać najwyżej ${UNIT_SERIES_MAX} lokali`,
    });
  }
}

export const unitSeriesSchema = z
  .object(unitSeriesShape)
  .superRefine(checkUnitSeries);

export const createdSchema = z.object({ id: z.string() });

export const unitSeriesResultSchema = z.object({
  created: z.number().int().describe("Units added"),
  skipped: z.number().int().describe("Numbers that already existed"),
});

export type BuildingInput = z.infer<typeof buildingSchema>;
export type BuildingNameInput = z.infer<typeof buildingNameFormSchema>;
export type StaircaseInput = z.infer<typeof staircaseSchema>;
export type UnitInput = z.infer<typeof unitSchema>;
export type UnitSeriesInput = z.infer<typeof unitSeriesSchema>;
export type UnitSeriesResult = z.infer<typeof unitSeriesResultSchema>;
