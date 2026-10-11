import { toast } from "sonner";

const INVITATIONS_SOON =
  "Dołączanie przez zaproszenie będzie dostępne wkrótce.";

export function useController() {
  // Invitations come with their own ticket; until then the tile only says so.
  // The id keeps repeated clicks from stacking toasts.
  function joinWithInvitation() {
    toast(INVITATIONS_SOON, { id: INVITATIONS_SOON });
  }

  return { joinWithInvitation };
}
