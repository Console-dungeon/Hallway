import { type SignInInput, signInSchema } from "@hallway/shared";
import { useMutation } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { signInWithGithub } from "@/lib/auth-actions";
import { authClient } from "@/lib/auth-client";
import { AuthError } from "@/lib/auth-errors";
import { type FieldErrors, parseForm } from "@/lib/form";

interface ControllerProps {
  /** Message for a failed redirect back to this page (e.g. cancelled GitHub sign-in). */
  redirectError?: string | undefined;
  /** Message for a successful step that ended here (e.g. password changed). */
  redirectNotice?: string | undefined;
}

export function useController({
  redirectError,
  redirectNotice,
}: ControllerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [errors, setErrors] = useState<FieldErrors<SignInInput>>({});

  const signIn = useMutation({
    mutationFn: async (input: SignInInput) => {
      const { error } = await authClient.signIn.email(input);
      if (error) throw new AuthError(error);
    },
    onSuccess: () => {
      router.push("/");
      router.refresh();
    },
    onError: (error, input) => {
      // The API has just sent a fresh verification link to this address
      if (error instanceof AuthError && error.code === "EMAIL_NOT_VERIFIED") {
        router.push(`/verify-email?email=${encodeURIComponent(input.email)}`);
      }
    },
  });

  const github = useMutation({ mutationFn: signInWithGithub });

  // Show what happened on the way here once, then drop the query string so a refresh
  // doesn't repeat it. The toast id keeps a re-run of the effect from stacking toasts.
  useEffect(() => {
    if (!redirectError && !redirectNotice) return;
    if (redirectError) toast.error(redirectError, { id: redirectError });
    if (redirectNotice) toast.success(redirectNotice, { id: redirectNotice });
    router.replace(pathname);
  }, [redirectError, redirectNotice, pathname, router]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { data, errors } = parseForm(signInSchema, event.currentTarget);
    setErrors(errors ?? {});
    if (data) signIn.mutate(data);
  }

  return {
    errors,
    formError: signIn.error?.message,
    isPending: signIn.isPending,
    onSubmit,
    github: {
      error: github.error?.message,
      isPending: github.isPending,
      signIn: () => github.mutate(),
    },
  };
}
