import { ticketStatuses } from "@hallway/shared";

import { Button } from "@/components/ui/button";

export default function Home() {
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
    </main>
  );
}
