import { type ResetPasswordInput, resetPasswordSchema } from "@hallway/shared";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import { AuthError } from "@/lib/auth-errors";
import { type FieldErrors, parseForm } from "@/lib/form";

/** `token` comes from the link in the password reset e-mail. */
export function useController(token: string | undefined) {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors<ResetPasswordInput>>({});

  const reset = useMutation({
    mutationFn: async ({ password }: ResetPasswordInput) => {
      const { error } = await authClient.resetPassword({
        newPassword: password,
        ...(token && { token }),
      });
      if (error) throw new AuthError(error);
    },
    onSuccess: () => router.push("/login?notice=password-reset"),
  });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { data, errors } = parseForm(
      resetPasswordSchema,
      event.currentTarget,
    );
    setErrors(errors ?? {});
    if (data) reset.mutate(data);
  }

  return {
    errors,
    formError: reset.error?.message,
    isPending: reset.isPending,
    onSubmit,
  };
}
