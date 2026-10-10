import { type SignUpInput, signUpSchema } from "@hallway/shared";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { signInWithGithub } from "@/lib/auth-actions";
import { authClient } from "@/lib/auth-client";
import { AuthError } from "@/lib/auth-errors";
import { type FieldErrors, parseForm } from "@/lib/form";

export function useController() {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors<SignUpInput>>({});

  const signUp = useMutation({
    mutationFn: async (input: SignUpInput) => {
      // callbackURL: where the link from the verification e-mail lands
      const { error } = await authClient.signUp.email({
        ...input,
        callbackURL: "/",
      });
      if (error) throw new AuthError(error);
    },
    onSuccess: (_data, input) => {
      router.push(`/verify-email?email=${encodeURIComponent(input.email)}`);
    },
  });

  const github = useMutation({ mutationFn: signInWithGithub });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { data, errors } = parseForm(signUpSchema, event.currentTarget);
    setErrors(errors ?? {});
    if (data) signUp.mutate(data);
  }

  return {
    errors,
    formError: signUp.error?.message,
    isPending: signUp.isPending,
    onSubmit,
    github: {
      error: github.error?.message,
      isPending: github.isPending,
      signIn: () => github.mutate(),
    },
  };
}
