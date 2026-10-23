import { z } from "zod";

import { communityContract } from "../errors.js";
import { sendInvitationErrors } from "../invitations/contract.js";
import {
  checkCompanyName,
  communityInvitationShape,
  invitationCreatedSchema,
  unitInvitationSchema,
} from "../invitations/schemas.js";
import {
  communityMemberRoleShape,
  communityMemberSchema,
  memberRefSchema,
  unitMemberSchema,
  updateUnitMemberSchema,
} from "./schemas.js";

const tags = ["members"];

// Path parameters; every route starts with the community, which is what permissions hang on
const inCommunity = { communityId: z.string() };
const member = { ...inCommunity, userId: z.string() };
const unit = { ...inCommunity, unitId: z.string() };
const unitMember = { ...unit, userId: z.string() };

const lastAdminErrors = {
  LAST_ADMIN: {
    status: 409,
    message: "Wspólnota musi mieć co najmniej jednego administratora.",
  },
} as const;

/** People with a role in the community as a whole (admins, workers, contractors). */
export const membersContract = {
  list: communityContract
    .route({
      method: "GET",
      path: "/communities/{communityId}/members",
      tags,
      summary: "Admins, workers and contractors of a community",
    })
    .input(z.object(inCommunity))
    .output(z.array(communityMemberSchema)),
  update: communityContract
    .route({
      method: "PATCH",
      path: "/communities/{communityId}/members/{userId}",
      tags,
      summary: "Change someone's role in the community",
    })
    .errors(lastAdminErrors)
    .input(
      z
        .object({ ...member, ...communityMemberRoleShape })
        .superRefine(checkCompanyName),
    )
    .output(memberRefSchema),
  remove: communityContract
    .route({
      method: "DELETE",
      path: "/communities/{communityId}/members/{userId}",
      tags,
      summary: "Take away someone's community role; unit assignments stay",
    })
    .errors(lastAdminErrors)
    .input(z.object(member))
    .output(memberRefSchema),
};

export const communityMembersContract = {
  invite: communityContract
    .route({
      method: "POST",
      path: "/communities/{communityId}/invitations",
      successStatus: 201,
      tags,
      summary: "E-mail an invitation to join as admin, worker or contractor",
    })
    .errors(sendInvitationErrors)
    .input(
      z
        .object({ ...inCommunity, ...communityInvitationShape })
        .superRefine(checkCompanyName),
    )
    .output(invitationCreatedSchema),
};

/** Owners and residents of one unit. */
export const unitMembersContract = {
  invite: communityContract
    .route({
      method: "POST",
      path: "/communities/{communityId}/units/{unitId}/invitations",
      successStatus: 201,
      tags,
      summary: "E-mail an invitation to a unit as owner or resident",
    })
    .errors(sendInvitationErrors)
    .input(unitInvitationSchema.extend(unit))
    .output(invitationCreatedSchema),
  list: communityContract
    .route({
      method: "GET",
      path: "/communities/{communityId}/units/{unitId}/members",
      tags,
      summary:
        "Owners and residents of a unit; for admins and for the people of that unit",
    })
    .input(z.object(unit))
    .output(z.array(unitMemberSchema)),
  update: communityContract
    .route({
      method: "PATCH",
      path: "/communities/{communityId}/units/{unitId}/members/{userId}",
      tags,
      summary: "Change someone's role in a unit",
    })
    .input(updateUnitMemberSchema.extend(unitMember))
    .output(memberRefSchema),
  remove: communityContract
    .route({
      method: "DELETE",
      path: "/communities/{communityId}/units/{unitId}/members/{userId}",
      tags,
      summary: "Remove someone from a unit",
    })
    .input(z.object(unitMember))
    .output(memberRefSchema),
};
