import { os } from "../../orpc/context.js";
import { requireAuth } from "../../orpc/middleware.js";
import * as service from "./invitations.service.js";
import { InvitationError } from "./invitations.service.js";

/**
 * Runs a service call and turns its domain errors into the errors of the contract. Each
 * procedure declares only the errors it can answer with; a code it lacks is a bug and
 * stays a 500.
 */
async function answer<T>(
  errors: Partial<Record<InvitationError["code"], () => Error>>,
  call: () => Promise<T>,
) {
  try {
    return await call();
  } catch (error) {
    const toContract =
      error instanceof InvitationError ? errors[error.code] : undefined;
    if (toContract) throw toContract();
    throw error;
  }
}

// Public: the token in the link is the only credential
export const get = os.invitations.get.handler(({ context, input }) =>
  service.previewInvitation(context.db, input.token),
);

// Public: the token proves the e-mail address, so the new account needs no verification
export const register = os.invitations.register.handler(
  ({ context, input, errors }) =>
    answer(errors, () =>
      service.registerFromInvitation(context, input.token, {
        name: input.name,
        password: input.password,
      }),
    ),
);

export const accept = os.invitations.accept
  .use(requireAuth)
  .handler(({ context, input, errors }) =>
    answer(errors, () =>
      service.acceptInvitation(context.db, input.token, context.user),
    ),
  );
