import {
  type InvitationSignUpInput,
  invitationSignUpSchema,
} from "@hallway/shared";
import { ORPCError } from "@orpc/client";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { AuthError } from "@/lib/auth-errors";
import { type FieldErrors, parseForm } from "@/lib/form";
import { invitationLoginPath } from "@/lib/invitation-links";
import { client, orpc } from "@/lib/orpc";

import type { InvitationDetails } from "./Client";

export function useController(
  token: string,
  invitation: InvitationDetails | undefined,
) {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors<InvitationSignUpInput>>({});

  /**
   * Into the community that was joined. Contractors have no community page, so they go to
   * the dashboard with the confirmation right away; everyone else gets it there (?joined).
   */
  function goToCommunity(communityId: string) {
    if (invitation?.role === "contractor") {
      toast.success(`Dołączono do wspólnoty ${invitation.communityName}`);
      router.push("/");
    } else {
      router.push(`/communities/${encodeURIComponent(communityId)}?joined=1`);
    }
    router.refresh();
  }

  const accept = useMutation({
    ...orpc.invitations.accept.mutationOptions(),
    onSuccess: ({ communityId }) => goToCommunity(communityId),
  });

  // The e-mail is the invitation's: the API takes it from the token, the form never sends it
  const register = useMutation({
    mutationFn: async (input: InvitationSignUpInput) => {
      if (!invitation) throw new Error("Sign-up without an invitation");
      const { communityId } = await client.invitations.register({
        token,
        ...input,
      });
      const { error } = await authClient.signIn.email({
        email: invitation.email,
        password: input.password,
      });
      if (error) throw new AuthError(error);
      return communityId;
    },
    onSuccess: goToCommunity,
  });

  const switchAccount = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.signOut();
      if (error) throw new AuthError(error);
    },
    onSuccess: () => {
      router.push(invitationLoginPath(token));
      router.refresh();
    },
  });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { data, errors } = parseForm(
      invitationSignUpSchema,
      event.currentTarget,
    );
    setErrors(errors ?? {});
    if (data) register.mutate(data);
  }

  return {
    // Sign-up form
    errors,
    formError: register.error?.message,
    /** The address already has an account: the form error comes with a sign-in link. */
    accountExists:
      register.error instanceof ORPCError &&
      register.error.code === "ACCOUNT_EXISTS",
    isPending: register.isPending || register.isSuccess,
    onSubmit,
    accept: {
      error: accept.error?.message,
      isPending: accept.isPending || accept.isSuccess,
      run: () => accept.mutate({ token }),
    },
    switchAccount: {
      error: switchAccount.error?.message,
      isPending: switchAccount.isPending,
      run: () => switchAccount.mutate(),
    },
  };
}
