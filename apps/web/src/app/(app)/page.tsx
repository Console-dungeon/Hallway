import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Pulpit – Hallway" };

export default async function DashboardPage() {
  const session = await getSession();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Cześć, {session?.user.name}
        </h1>
        <p className="text-muted-foreground">
          Nie należysz jeszcze do żadnej wspólnoty. Wybierz, od czego zacząć.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Załóż wspólnotę</CardTitle>
            <CardDescription>
              Zostaniesz jej administratorem: dodasz budynki, lokale i zaprosisz
              mieszkańców.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Enabled by the communities ticket */}
            <Button disabled>Wkrótce</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Poczekaj na zaproszenie</CardTitle>
            <CardDescription>
              Jeśli Twoja wspólnota już korzysta z Hallway, administrator wyśle
              Ci zaproszenie na adres{" "}
              <span className="break-all">{session?.user.email}</span>.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
