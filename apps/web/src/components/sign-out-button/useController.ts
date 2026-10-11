import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { AuthError } from "@/lib/auth-errors";

export function useController() {
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

  return {
    isPending: signOut.isPending,
    signOut: () => signOut.mutate(),
  };
}
