"use client";

import type { CommunityDetail } from "@hallway/shared";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { FormAlert } from "@/components/form-alert";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";

import { DeleteCommunityDialog } from "./_components/delete-community-dialog";
import { useController } from "./useController";

interface ClientProps {
  /** The community as loaded on the server; only admins get here. */
  community: CommunityDetail;
}

const cardClassName =
  "flex flex-col gap-5 rounded-xl bg-card p-6 ring-1 2xl:gap-6 2xl:p-8";
const buttonClassName =
  "h-12 w-full px-5 text-base sm:w-auto 2xl:h-14 2xl:px-6 2xl:text-lg";

export function Client({ community: initial }: ClientProps) {
  const {
    community,
    canUpdate,
    canDelete,
    errors,
    formError,
    isPending,
    onSubmit,
    deletion,
  } = useController({ community: initial });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 pt-2 2xl:max-w-3xl 2xl:gap-8 2xl:pt-6">
      <nav
        aria-label="Okruszki"
        className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground 2xl:text-base"
      >
        <Link href="/" className="shrink-0 underline-offset-4 hover:underline">
          Pulpit
        </Link>
        <ChevronRight className="size-4 shrink-0" />
        <Link
          href={`/communities/${community.id}`}
          className="truncate underline-offset-4 hover:underline"
        >
          {community.name}
        </Link>
        <ChevronRight className="size-4 shrink-0" />
        <span className="shrink-0 font-medium text-foreground">Ustawienia</span>
      </nav>

      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl 2xl:text-4xl">
          Ustawienia wspólnoty
        </h1>
        <p className="text-base text-muted-foreground 2xl:text-lg">
          {community.name}
        </p>
      </div>

      {canUpdate && (
        <section
          aria-labelledby="community-data"
          className={`${cardClassName} ring-foreground/10`}
        >
          <div className="flex flex-col gap-0.5">
            <h2 id="community-data" className="text-lg font-medium 2xl:text-xl">
              Dane wspólnoty
            </h2>
            <p className="text-sm text-muted-foreground 2xl:text-base">
              Nazwę i adres widzą wszyscy członkowie wspólnoty.
            </p>
          </div>
          <form onSubmit={onSubmit} noValidate>
            <FieldGroup className="2xl:gap-6">
              {formError && <FormAlert>{formError}</FormAlert>}
              <TextField
                name="name"
                label="Nazwa wspólnoty"
                defaultValue={community.name}
                error={errors.name}
              />
              <TextField
                name="address"
                label="Adres"
                autoComplete="street-address"
                defaultValue={community.address}
                error={errors.address}
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  className={buttonClassName}
                  disabled={isPending}
                >
                  Zapisz zmiany
                </Button>
              </div>
            </FieldGroup>
          </form>
        </section>
      )}

      {canDelete && (
        <section
          aria-labelledby="danger-zone"
          className={`${cardClassName} gap-3 ring-destructive/30 2xl:gap-4`}
        >
          <p
            id="danger-zone"
            className="text-sm font-medium text-destructive 2xl:text-base"
          >
            Strefa zagrożenia
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <h2 className="text-lg font-medium 2xl:text-xl">
                Usuń wspólnotę
              </h2>
              <p className="text-sm text-muted-foreground 2xl:text-base">
                Wspólnota zniknie dla wszystkich członków. Dane zostaną
                zachowane, ale nikt nie będzie miał do nich dostępu.
              </p>
            </div>
            <Button
              type="button"
              variant="destructive"
              className={buttonClassName}
              onClick={deletion.open}
            >
              Usuń wspólnotę
            </Button>
          </div>
        </section>
      )}

      {deletion.isOpen && (
        <DeleteCommunityDialog
          name={community.name}
          confirmation={deletion.confirmation}
          setConfirmation={deletion.setConfirmation}
          canConfirm={deletion.canConfirm}
          formError={deletion.formError}
          onConfirm={deletion.confirm}
          onClose={deletion.close}
        />
      )}
    </div>
  );
}
