import type { ORPC } from "@hallway/shared";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

/**
 * Typed API client built from the shared oRPC contract.
 * In the browser it calls /api/rpc on the same origin. On the server (RSC, route handlers)
 * there is no origin, so it calls the API directly: API_INTERNAL_URL in Docker, localhost in dev.
 */
const link = new RPCLink({
  url: () =>
    typeof window === "undefined"
      ? `${process.env.API_INTERNAL_URL ?? "http://127.0.0.1:3001"}/api/rpc`
      : `${window.location.origin}/api/rpc`,
});

export const client: ContractRouterClient<ORPC> = createORPCClient(link);

/**
 * TanStack Query helpers for client components, e.g.
 * `useQuery(orpc.system.health.queryOptions())`. Server components call `client` directly.
 */
export const orpc = createTanstackQueryUtils(client);
