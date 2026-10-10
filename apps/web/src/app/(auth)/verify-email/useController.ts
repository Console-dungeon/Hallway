import { useMutation } from "@tanstack/react-query";

import { authClient } from "@/lib/auth-client";
import { AuthError } from "@/lib/auth-errors";

/** `email` is the address the verification link was sent to, if the page knows it. */
export function useController(email: string | undefined) {
  const resend = useMutation({
    mutationFn: async () => {
      if (!email) return;
      const { error } = await authClient.sendVerificationEmail({
        email,
        callbackURL: "/",
      });
      if (error) throw new AuthError(error);
    },
  });

  return {
    resendError: resend.error?.message,
    isResending: resend.isPending,
    isResent: resend.isSuccess,
    resend: () => resend.mutate(),
  };
}
