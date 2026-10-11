"use client";

import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useController } from "./useController";

export function SignOutButton() {
  const { isPending, signOut } = useController();

  return (
    <Button
      variant="outline"
      className="h-10 gap-2 px-4 text-base font-normal 2xl:h-11 2xl:px-5 2xl:text-lg"
      disabled={isPending}
      onClick={signOut}
    >
      <LogOut className="size-4 2xl:size-5" />
      Wyloguj
    </Button>
  );
}
