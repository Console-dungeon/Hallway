"use client";

import { Button } from "@/components/ui/button";

import { useController } from "./useController";

export function SignOutButton() {
  const { isPending, signOut } = useController();

  return (
    <Button variant="outline" size="sm" disabled={isPending} onClick={signOut}>
      Wyloguj
    </Button>
  );
}
