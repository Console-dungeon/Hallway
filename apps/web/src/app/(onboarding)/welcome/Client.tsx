"use client";

import { Building2, MailOpen } from "lucide-react";

import { ChoiceTile } from "../_components/choice-tile";
import { useController } from "./useController";

interface ClientProps {
  firstName: string;
}

export function Client({ firstName }: ClientProps) {
  const { joinWithInvitation } = useController();

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-10 2xl:max-w-5xl 2xl:gap-12 3xl:max-w-7xl 3xl:gap-14">
      <div className="flex flex-col gap-2 text-center 3xl:gap-4">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl 2xl:text-5xl 3xl:text-6xl">
          Witaj w Hallway, {firstName}
        </h1>
        <p className="text-lg text-muted-foreground 2xl:text-xl 3xl:text-2xl">
          Nie należysz jeszcze do żadnej wspólnoty. Od czego zaczynamy?
        </p>
      </div>
      <div className="grid w-full gap-6 md:grid-cols-2 3xl:gap-8">
        <ChoiceTile
          icon={Building2}
          title="Zakładam wspólnotę"
          description="Zostaniesz jej administratorem. Dodasz budynki i lokale, a potem zaprosisz mieszkańców."
          action="Załóż wspólnotę"
          href="/communities/new"
        />
        <ChoiceTile
          icon={MailOpen}
          title="Mam zaproszenie"
          description="Twoja wspólnota już korzysta z Hallway. Wklej link, który dostałeś e-mailem od administratora."
          action="Dołącz do wspólnoty"
          onClick={joinWithInvitation}
        />
      </div>
      <p className="text-center text-base text-muted-foreground 2xl:text-lg 3xl:text-xl">
        Możesz należeć do kilku wspólnot. Kolejne dodasz później w aplikacji.
      </p>
    </div>
  );
}
