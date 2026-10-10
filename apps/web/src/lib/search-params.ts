/** A query parameter as a single string (Next gives string | string[] | undefined). */
export function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
