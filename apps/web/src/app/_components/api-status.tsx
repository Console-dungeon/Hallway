"use client";

import { isDefinedError } from "@orpc/client";
import { useQuery } from "@tanstack/react-query";

import { orpc } from "@/lib/orpc";

export function ApiStatus() {
  const { data, error, isPending } = useQuery(
    orpc.system.health.queryOptions({ retry: false }),
  );

  let status = "niedostępne";
  if (isPending) status = "sprawdzanie…";
  else if (data) status = `działa (baza: ${data.database})`;
  else if (isDefinedError(error))
    status = `problem (baza: ${error.data.database})`;

  return <p className="text-sm text-muted-foreground">API: {status}</p>;
}
