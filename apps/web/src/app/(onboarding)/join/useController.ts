import { useRouter } from "next/navigation";
import { useState } from "react";

import { findInvitationToken, invitationPath } from "@/lib/invitation-links";

/** Start of every invitation link, e.g. "https://hallway.pl/invitations/". */
export function useController(invitationsUrl: string) {
  const router = useRouter();
  const [errors, setErrors] = useState<{ link?: string }>({});
  const [isPending, setIsPending] = useState(false);

  // Only finds the token in the pasted text; the invitation page checks it with the API
  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const link = new FormData(event.currentTarget).get("link");
    const token = findInvitationToken(typeof link === "string" ? link : "");
    if (!token) {
      setErrors({
        link: `To nie jest link z zaproszenia. Skopiuj z e-maila cały link – zaczyna się od ${invitationsUrl}`,
      });
      return;
    }
    setErrors({});
    setIsPending(true);
    router.push(invitationPath(token));
  }

  return { errors, isPending, onSubmit };
}
