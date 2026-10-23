import { methods } from "../modules/auth/auth.procedures.js";
import {
  create as createCommunity,
  get as getCommunity,
  remove as removeCommunity,
  update as updateCommunity,
} from "../modules/communities/communities.procedures.js";
import {
  accept as acceptInvitation,
  get as getInvitation,
  register as registerFromInvitation,
} from "../modules/invitations/invitations.procedures.js";
import { locations } from "../modules/locations/locations.procedures.js";
import { get as getMe } from "../modules/me/me.procedures.js";
import {
  communityMembers,
  members,
  unitMembers,
} from "../modules/members/members.procedures.js";
import {
  buildings,
  staircases,
  units,
} from "../modules/structure/structure.procedures.js";
import { health } from "../modules/system/health.procedures.js";
import { os } from "./context.js";

export const router = os.router({
  auth: { methods },
  communities: {
    create: createCommunity,
    get: getCommunity,
    update: updateCommunity,
    remove: removeCommunity,
  },
  communityMembers,
  invitations: {
    get: getInvitation,
    register: registerFromInvitation,
    accept: acceptInvitation,
  },
  locations,
  me: { get: getMe },
  members,
  structure: { buildings, staircases, units },
  unitMembers,
  system: { health },
});
