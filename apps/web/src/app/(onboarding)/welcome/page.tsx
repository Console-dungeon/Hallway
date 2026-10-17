import { Building2, MailOpen } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { belongsSomewhere, firstName, getMe } from "@/lib/me";

import { ChoiceTile } from "../_components/choice-tile";

export const metadata: Metadata = { title: "Pierwsze kroki – Hallway" };

export default async function WelcomePage() {
  const me = await getMe();
  if (!me) redirect("/login");
  if (belongsSomewhere(me)) redirect("/");

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-10 2xl:max-w-5xl 2xl:gap-12">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl 2xl:text-5xl">
          Witaj w Hallway, {firstName(me)}
        </h1>
        <p className="text-lg text-muted-foreground 2xl:text-xl">
          Nie należysz jeszcze do żadnej wspólnoty. Od czego zaczynamy?
        </p>
      </div>
      <div className="grid w-full gap-6 md:grid-cols-2">
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
          href="/join"
        />
      </div>
      <p className="text-center text-base text-muted-foreground 2xl:text-lg">
        Możesz należeć do kilku wspólnot. Kolejne dodasz później w aplikacji.
      </p>
    </div>
  );
}
