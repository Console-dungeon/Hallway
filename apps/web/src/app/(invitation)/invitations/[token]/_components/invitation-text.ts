import { invitationRoleLabels } from "@hallway/shared";

import { unitPlace } from "@/lib/units";

import type { InvitationDetails } from "../Client";

/** "Ewa Nowak zaprasza Cię do …" without the full stop; the inviter's account may be gone. */
export function invitedTo(invitation: InvitationDetails, where: string) {
  return invitation.invitedByName
    ? `${invitation.invitedByName} zaprasza Cię do ${where}`
    : `Zaproszono Cię do ${where}`;
}

/** The rows under the community name: role, then the unit or the company. */
export function invitationDetails(invitation: InvitationDetails) {
  const rows: { label: string; value: string }[] = [
    { label: "Rola", value: invitationRoleLabels[invitation.role] },
  ];
  if (invitation.unit) {
    rows.push({ label: "Lokal", value: unitPlace(invitation.unit) });
  }
  if (invitation.companyName) {
    rows.push({ label: "Firma", value: invitation.companyName });
  }
  return rows;
}
