import { INVITATION_VALID_DAYS, type InvitationRole } from "@hallway/shared";

import { actionEmail } from "../../../mail/layout.js";

interface InvitationEmail {
  communityName: string;
  role: InvitationRole;
  /** For owner and resident invitations. */
  unit: { buildingName: string; staircaseName: string; number: string } | null;
  /** For contractor invitations. */
  companyName: string | null;
  invitedByName: string;
  url: string;
}

/** "jako …" part of the sentence, with the unit or the company where the role has one. */
function asRole({ role, unit, companyName }: InvitationEmail) {
  const where = unit
    ? ` lokalu ${unit.number} (${unit.buildingName}, klatka ${unit.staircaseName})`
    : "";
  switch (role) {
    case "admin":
      return "jako administrator";
    case "worker":
      return "jako pracownik";
    case "contractor":
      return companyName
        ? `jako wykonawca (firma ${companyName})`
        : "jako wykonawca";
    case "owner":
      return `jako właściciel${where}`;
    case "resident":
      return `jako mieszkaniec${where}`;
  }
}

export const invitationEmail = (invitation: InvitationEmail) =>
  actionEmail({
    subject: `Zaproszenie do wspólnoty ${invitation.communityName} w Hallway`,
    heading: `Zaproszenie do wspólnoty ${invitation.communityName}`,
    body: `${invitation.invitedByName} zaprasza Cię do wspólnoty „${invitation.communityName}” w Hallway ${asRole(invitation)}. Link jest ważny ${INVITATION_VALID_DAYS} dni.`,
    action: "Przyjmij zaproszenie",
    url: invitation.url,
    ignoreNote:
      "Jeśli nie spodziewasz się tego zaproszenia, zignoruj tę wiadomość.",
  });
