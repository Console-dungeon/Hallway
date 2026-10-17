import { STAIRCASES_MAX } from "@hallway/shared";

/** Staircases are named with consecutive letters, so adding one takes a single click. */
const STAIRCASE_NAMES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  .slice(0, STAIRCASES_MAX)
  .split("");

/** The list with the first unused letter added; unchanged when every letter is taken. */
export function withNextStaircase(staircases: string[]) {
  const next = STAIRCASE_NAMES.find((name) => !staircases.includes(name));
  return next ? [...staircases, next].sort() : staircases;
}

export function canAddStaircase(staircases: string[]) {
  return staircases.length < STAIRCASES_MAX;
}
