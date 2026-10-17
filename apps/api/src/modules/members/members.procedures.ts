import type { FastifyBaseLogger } from "fastify";

import { os } from "../../orpc/context.js";
import { requireCommunity, requireUnit } from "../../orpc/middleware.js";
import * as invitations from "../invitations/invitations.service.js";
import { InvitationError } from "../invitations/invitations.service.js";
import * as service from "./members.service.js";
import { MembersError } from "./members.service.js";

type DomainCode = MembersError["code"] | InvitationError["code"];

/**
 * Runs a service call and turns its domain errors into the errors of the contract. Each
 * procedure declares only the errors it can answer with; a code it lacks is a bug and
 * stays a 500. The cause (e.g. why an e-mail could not be sent) goes to the log.
 */
async function answer<T>(
  log: FastifyBaseLogger,
  errors: Partial<Record<DomainCode, () => Error>>,
  call: () => Promise<T>,
) {
  try {
    return await call();
  } catch (error) {
    if (error instanceof MembersError || error instanceof InvitationError) {
      if (error.cause) log.error(error.cause, `Members: ${error.code}`);
      const toContract = errors[error.code];
      if (toContract) throw toContract();
    }
    throw error;
  }
}

const manage = requireCommunity("members.manage");

export const members = {
  list: os.members.list
    .use(requireCommunity("members.list"))
    .handler(({ context, input }) =>
      service.listMembers(context.db, input.communityId),
    ),
  update: os.members.update.use(manage).handler(({ context, input, errors }) =>
    answer(context.log, errors, () =>
      service.updateMember(context.db, input.communityId, input.userId, {
        role: input.role,
        companyName: input.companyName,
      }),
    ),
  ),
  remove: os.members.remove
    .use(manage)
    .handler(({ context, input, errors }) =>
      answer(context.log, errors, () =>
        service.removeMember(context.db, input.communityId, input.userId),
      ),
    ),
};

export const communityMembers = {
  invite: os.communityMembers.invite
    .use(requireCommunity("communityMembers.invite"))
    .handler(({ context, input, errors }) =>
      answer(context.log, errors, () =>
        invitations.inviteToCommunity(
          { ...context, appUrl: context.env.BETTER_AUTH_URL },
          input.communityId,
          context.user,
          {
            email: input.email,
            role: input.role,
            companyName: input.companyName,
          },
        ),
      ),
    ),
};

export const unitMembers = {
  invite: os.unitMembers.invite
    .use(requireCommunity("unitMembers.invite"))
    .handler(({ context, input, errors }) =>
      answer(context.log, errors, () =>
        invitations.inviteToUnit(
          { ...context, appUrl: context.env.BETTER_AUTH_URL },
          input.communityId,
          input.unitId,
          context.user,
          { email: input.email, role: input.role },
        ),
      ),
    ),
  // Admins (and the superadmin) see anyone's unit, owners and residents their own
  list: os.unitMembers.list
    .use(requireUnit("unitMembers.list"))
    .handler(({ context, input, errors }) =>
      answer(context.log, errors, () =>
        service.listUnitMembers(context.db, input.communityId, input.unitId),
      ),
    ),
  update: os.unitMembers.update
    .use(manage)
    .handler(({ context, input, errors }) =>
      answer(context.log, errors, () =>
        service.updateUnitMember(
          context.db,
          input.communityId,
          input.unitId,
          input.userId,
          input.role,
        ),
      ),
    ),
  remove: os.unitMembers.remove
    .use(manage)
    .handler(({ context, input, errors }) =>
      answer(context.log, errors, () =>
        service.removeUnitMember(
          context.db,
          input.communityId,
          input.unitId,
          input.userId,
        ),
      ),
    ),
};
