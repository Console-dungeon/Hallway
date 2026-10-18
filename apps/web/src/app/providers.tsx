"use client";

import { ORPCError } from "@orpc/client";
import {
  isServer,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      // Data rendered a moment ago isn't refetched right after hydration
      queries: {
        staleTime: 60_000,
        // A refusal or a missing resource (4xx) won't change on retry, e.g. the member
        // list right after an admin gives up their own role; only network and 5xx errors
        // are retried
        retry: (failureCount, error) =>
          !(
            error instanceof ORPCError &&
            error.status >= 400 &&
            error.status < 500
          ) && failureCount < 3,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  // On the server every request gets its own client, so users never share cached data
  if (isServer) return makeQueryClient();
  return (browserQueryClient ??= makeQueryClient());
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}
