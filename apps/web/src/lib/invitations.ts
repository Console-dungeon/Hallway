import type { InvitationPreview } from "@hallway/shared";
import { ORPCError } from "@orpc/client";

import { serverClient } from "./orpc-server";

const invalid: InvitationPreview = {
  state: "invalid",
  alreadyMember: false,
  accountExists: false,
  invitation: null,
};

/**
 * What an invitation link grants, for server components. A token the API rejects as
 * malformed looks the same as an unknown one.
 */
export async function getInvitation(token: string): Promise<InvitationPreview> {
  try {
    return await serverClient.invitations.get({ token });
  } catch (error) {
    if (error instanceof ORPCError && error.code === "BAD_REQUEST") {
      return invalid;
    }
    throw error;
  }
}
