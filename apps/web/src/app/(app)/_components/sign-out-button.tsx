"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { AuthError } from "@/lib/auth-errors";

export function SignOutButton() {
  const router = useRouter();

  const signOut = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.signOut();
      if (error) throw new AuthError(error);
    },
    onSuccess: () => {
      router.push("/login");
      router.refresh();
    },
  });

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={signOut.isPending}
      onClick={() => signOut.mutate()}
    >
      Wyloguj
    </Button>
  );
}
