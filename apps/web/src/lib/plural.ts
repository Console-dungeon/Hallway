/**
 * Polish plural of a counted noun: `plural(1, LOKAL)` → "1 lokal", 3 → "3 lokale",
 * 12 → "12 lokali".
 */
export function plural(
  count: number,
  forms: readonly [string, string, string],
) {
  const [one, few, many] = forms;
  const lastTwo = count % 100;
  const last = count % 10;
  const form =
    count === 1
      ? one
      : last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)
        ? few
        : many;
  return `${count} ${form}`;
}

export const LOKAL = ["lokal", "lokale", "lokali"] as const;
export const KLATKA = ["klatka", "klatki", "klatek"] as const;
export const CZESC_WSPOLNA = [
  "część wspólna",
  "części wspólne",
  "części wspólnych",
] as const;
