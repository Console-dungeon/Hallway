import { oc } from "@orpc/contract";
import { z } from "zod";

import { protectedContract } from "../errors.js";
import {
  invitationAcceptedSchema,
  invitationPreviewSchema,
  invitationSignUpSchema,
  invitationTokenSchema,
} from "./schemas.js";

/** Errors of the link flow (preview, sign-up, accept). */
export const invitationErrors = {
  INVITATION_INVALID: {
    status: 404,
    message: "To zaproszenie jest nieprawidłowe albo nieaktualne.",
  },
  INVITATION_EXPIRED: {
    status: 410,
    message: "To zaproszenie wygasło. Poproś administratora wspólnoty o nowe.",
  },
  EMAIL_MISMATCH: {
    status: 403,
    message:
      "To zaproszenie wysłano na inny adres e-mail. Zaloguj się na konto z tym adresem.",
  },
  ACCOUNT_EXISTS: {
    status: 409,
    message:
      "Konto z tym adresem e-mail już istnieje. Zaloguj się, aby przyjąć zaproszenie.",
  },
} as const;

/** Errors of sending an invitation, besides those of `communityContract`. */
export const sendInvitationErrors = {
  MAIL_FAILED: {
    status: 502,
    message: "Nie udało się wysłać zaproszenia. Spróbuj ponownie za chwilę.",
  },
} as const;

const tags = ["invitations"];
const byToken = { token: invitationTokenSchema };

export const invitationsContract = {
  get: oc
    .route({
      method: "GET",
      path: "/invitations/{token}",
      tags,
      summary:
        "What an invitation link grants and whether it can still be used",
    })
    .input(z.object(byToken))
    .output(invitationPreviewSchema),
  register: oc
    .route({
      method: "POST",
      path: "/invitations/{token}/register",
      successStatus: 201,
      tags,
      summary:
        "Create an account for the invitation e-mail and accept the invitation; the token proves the address",
    })
    .errors({
      INVITATION_INVALID: invitationErrors.INVITATION_INVALID,
      INVITATION_EXPIRED: invitationErrors.INVITATION_EXPIRED,
      ACCOUNT_EXISTS: invitationErrors.ACCOUNT_EXISTS,
    })
    .input(invitationSignUpSchema.extend(byToken))
    .output(invitationAcceptedSchema),
  accept: protectedContract
    .route({
      method: "POST",
      path: "/invitations/{token}/accept",
      tags,
      summary:
        "Accept an invitation with the signed-in account; it must have the invitation e-mail",
    })
    .errors({
      INVITATION_INVALID: invitationErrors.INVITATION_INVALID,
      INVITATION_EXPIRED: invitationErrors.INVITATION_EXPIRED,
      EMAIL_MISMATCH: invitationErrors.EMAIL_MISMATCH,
    })
    .input(z.object(byToken))
    .output(invitationAcceptedSchema),
};
