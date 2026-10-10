import type { z } from "zod";

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

type ParsedForm<T> =
  | { data: T; errors?: undefined }
  | { data?: undefined; errors: FieldErrors<T> };

/** Validates a submitted <form> with a shared Zod schema; one message per field. */
export function parseForm<Schema extends z.ZodObject>(
  schema: Schema,
  form: HTMLFormElement,
): ParsedForm<z.infer<Schema>> {
  const result = schema.safeParse(Object.fromEntries(new FormData(form)));
  if (result.success) return { data: result.data };

  const errors: FieldErrors<z.infer<Schema>> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof z.infer<Schema> | undefined;
    if (field !== undefined) errors[field] ??= issue.message;
  }
  return { errors };
}
