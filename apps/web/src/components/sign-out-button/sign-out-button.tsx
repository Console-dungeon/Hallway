"use client";

import { Button } from "@/components/ui/button";

import { useController } from "./useController";

export function SignOutButton() {
  const { isPending, signOut } = useController();

  return (
    <Button
      variant="outline"
      className="h-10 px-4 text-base 2xl:h-12 2xl:px-5 2xl:text-lg 3xl:h-14 3xl:px-6 3xl:text-xl"
      disabled={isPending}
      onClick={signOut}
    >
      Wyloguj
    </Button>
  );
}
