import { methods } from "../modules/auth/auth.procedures.js";
import {
  create as createCommunity,
  get as getCommunity,
} from "../modules/communities/communities.procedures.js";
import { get as getMe } from "../modules/me/me.procedures.js";
import {
  buildings,
  staircases,
  units,
} from "../modules/structure/structure.procedures.js";
import { health } from "../modules/system/health.procedures.js";
import { os } from "./context.js";

export const router = os.router({
  auth: { methods },
  communities: { create: createCommunity, get: getCommunity },
  me: { get: getMe },
  structure: { buildings, staircases, units },
  system: { health },
});
