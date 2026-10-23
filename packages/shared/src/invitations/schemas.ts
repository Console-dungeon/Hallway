import { z } from "zod";

import { signUpSchema } from "../auth/schemas.js";
import {
  type CommunityMemberRole,
  communityMemberRoleSchema,
  invitationRoleSchema,
  unitMemberRoleSchema,
} from "../communities/roles.js";

/** How long an invitation link stays valid. */
export const INVITATION_VALID_DAYS = 7;

/** Stored and compared in lower case, so the case someone types doesn't matter. */
export const invitationEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Podaj poprawny adres e-mail"));

/** Contractors only; an empty string counts as not given. */
export const companyNameSchema = z
  .string()
  .trim()
  .max(120, "Nazwa firmy jest za długa")
  .optional();

/**
 * A contractor needs a company name, other roles must not have one. For
 * `z.object({ … }).superRefine(checkCompanyName)` with `role` and `companyName`.
 */
export function checkCompanyName(
  value: { role: CommunityMemberRole; companyName?: string | undefined },
  context: z.RefinementCtx,
) {
  if (value.role === "contractor" && !value.companyName) {
    context.addIssue({
      code: "custom",
      path: ["companyName"],
      message: "Podaj nazwę firmy wykonawcy",
    });
  } else if (value.role !== "contractor" && value.companyName) {
    context.addIssue({
      code: "custom",
      path: ["companyName"],
      message: "Nazwę firmy podaje się tylko dla wykonawcy",
    });
  }
}

/** Fields of an invitation to the community as a whole; check them with `checkCompanyName`. */
export const communityInvitationShape = {
  email: invitationEmailSchema,
  role: communityMemberRoleSchema,
  companyName: companyNameSchema,
};

/** Invitation to the community as admin, worker or contractor (the form). */
export const communityInvitationSchema = z
  .object(communityInvitationShape)
  .superRefine(checkCompanyName);

/** Invitation to one unit as owner or resident (the form; the unit comes from the path). */
export const unitInvitationSchema = z.object({
  email: invitationEmailSchema,
  role: unitMemberRoleSchema,
});

export const invitationCreatedSchema = z.object({
  id: z.string(),
  email: z.string().describe("Where the invitation was sent, in lower case"),
});

/** The token from the invitation link; only its hash is stored. */
export const invitationTokenSchema = z.string().min(1).max(200);

export const invitationStates = ["valid", "expired", "invalid"] as const;
export const invitationStateSchema = z.enum(invitationStates);
export type InvitationState = z.infer<typeof invitationStateSchema>;

/** What the invitation page shows before the invitation is accepted. */
export const invitationPreviewSchema = z.object({
  state: invitationStateSchema.describe(
    "invalid: unknown, revoked or no longer usable token (no details are given)",
  ),
  alreadyMember: z
    .boolean()
    .describe(
      "The account with the invitation e-mail already holds what the invitation grants; accepting changes nothing",
    ),
  accountExists: z
    .boolean()
    .describe(
      "An account with the invitation e-mail exists (sign in vs sign up)",
    ),
  invitation: z
    .object({
      email: z.string(),
      role: invitationRoleSchema,
      communityId: z.string(),
      communityName: z.string(),
      unit: z
        .object({
          buildingName: z.string(),
          staircaseName: z.string(),
          number: z.string(),
        })
        .nullable()
        .describe("Set for owner and resident invitations"),
      invitedByName: z
        .string()
        .nullable()
        .describe("Null when the inviting account no longer exists"),
      companyName: z.string().nullable().describe("Contractors only"),
    })
    .nullable()
    .describe("Null when the state is invalid"),
});

/** Sign-up from an invitation: the e-mail comes from the invitation, not from the form. */
export const invitationSignUpSchema = signUpSchema.pick({
  name: true,
  password: true,
});

export const invitationAcceptedSchema = z.object({
  communityId: z.string().describe("Where to go after accepting"),
});

export type CommunityInvitationInput = z.infer<
  typeof communityInvitationSchema
>;
export type UnitInvitationInput = z.infer<typeof unitInvitationSchema>;
export type InvitationCreated = z.infer<typeof invitationCreatedSchema>;
export type InvitationPreview = z.infer<typeof invitationPreviewSchema>;
export type InvitationSignUpInput = z.infer<typeof invitationSignUpSchema>;
export type InvitationAccepted = z.infer<typeof invitationAcceptedSchema>;
