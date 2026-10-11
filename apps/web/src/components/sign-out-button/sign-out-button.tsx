"use client";

import { Button } from "@/components/ui/button";

import { useController } from "./useController";

export function SignOutButton() {
  const { isPending, signOut } = useController();

  return (
    <Button
      variant="outline"
      className="h-10 px-4 text-base font-normal 2xl:h-11 2xl:px-5 2xl:text-lg"
      disabled={isPending}
      onClick={signOut}
    >
      Wyloguj
    </Button>
  );
}
