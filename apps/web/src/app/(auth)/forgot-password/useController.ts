import {
  type ForgotPasswordInput,
  forgotPasswordSchema,
} from "@hallway/shared";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import { AuthError } from "@/lib/auth-errors";
import { type FieldErrors, parseForm } from "@/lib/form";

export function useController() {
  const [errors, setErrors] = useState<FieldErrors<ForgotPasswordInput>>({});

  const request = useMutation({
    mutationFn: async ({ email }: ForgotPasswordInput) => {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });
      if (error) throw new AuthError(error);
    },
  });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { data, errors } = parseForm(
      forgotPasswordSchema,
      event.currentTarget,
    );
    setErrors(errors ?? {});
    if (data) request.mutate(data);
  }

  return {
    errors,
    formError: request.error?.message,
    isPending: request.isPending,
    isSent: request.isSuccess,
    onSubmit,
  };
}
