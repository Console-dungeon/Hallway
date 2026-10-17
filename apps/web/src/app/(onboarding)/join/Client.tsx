"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { FormAlert } from "@/components/form-alert";
import { FormCard } from "@/components/form-card";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";

import { useController } from "./useController";

interface ClientProps {
  /** Address of the signed-in account; only an invitation sent there can be accepted. */
  email: string;
  /** Start of every invitation link, e.g. "https://hallway.pl/invitations/". */
  invitationsUrl: string;
}

export function Client({ email, invitationsUrl }: ClientProps) {
  const { errors, isPending, onSubmit } = useController(invitationsUrl);

  return (
    <div className="w-full max-w-md 2xl:max-w-xl">
      <FormCard
        title="Dołącz do wspólnoty"
        description="Wklej link z e-maila z zaproszeniem. Jeśli go nie masz, poproś o niego administratora swojej wspólnoty."
        before={
          <Link
            href="/welcome"
            className="inline-flex h-10 items-center gap-2 self-start text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline 2xl:text-base"
          >
            <ArrowLeft className="size-4" />
            Wróć do wyboru
          </Link>
        }
      >
        <form onSubmit={onSubmit} noValidate>
          <FieldGroup className="2xl:gap-6">
            <TextField
              name="link"
              label="Link z zaproszenia"
              placeholder={`${invitationsUrl}…`}
              autoComplete="off"
              error={errors.link}
              autoFocus
            />
            <FormAlert variant="default">
              Zaproszenie przyjmiesz, jeśli zostało wysłane na adres {email}.
            </FormAlert>
            <Button
              type="submit"
              className="h-12 w-full text-base 2xl:h-14 2xl:text-lg"
              disabled={isPending}
            >
              Otwórz zaproszenie
            </Button>
          </FieldGroup>
        </form>
      </FormCard>
    </div>
  );
}
