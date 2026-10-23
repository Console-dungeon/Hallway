import type { Me } from "@hallway/shared";

/** Whether the user belongs to anything yet; if not, they start at /welcome. */
export function belongsSomewhere(me: Me) {
  return me.communities.length > 0 || me.units.length > 0;
}

/** "Jan" from "Jan Kowalski". */
export function firstName(me: Me) {
  return me.user.name.trim().split(/\s+/)[0] ?? me.user.name;
}
