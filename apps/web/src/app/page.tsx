import { ticketStatuses } from "@hallway/shared";
import { isDefinedError, safe } from "@orpc/client";
import { connection } from "next/server";

import { Button } from "@/components/ui/button";
import { orpc } from "@/lib/orpc";

async function apiStatus() {
  const { data, error } = await safe(orpc.system.health());
  if (!error) return `działa (baza: ${data.database})`;
  if (isDefinedError(error)) return `problem (baza: ${error.data.database})`;
  return "niedostępne";
}

export default async function Home() {
  // The API status is checked per request, not at build time
  await connection();
  const status = await apiStatus();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-semibold tracking-tight">
        Hallway – hello world
      </h1>
      <Button>Zaczynamy</Button>
      <p className="text-sm text-muted-foreground">
        Statusy zgłoszeń (z <code>@hallway/shared</code>):{" "}
        {ticketStatuses.join(", ")}
      </p>
      <p className="text-sm text-muted-foreground">API: {status}</p>
    </main>
  );
}
