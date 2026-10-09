import type { ORPC } from "@hallway/shared";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";

/**
 * Typed API client generated from the shared oRPC contract.
 * In the browser it calls /api/rpc on the same origin. On the server (RSC, route handlers)
 * there is no origin, so it calls the API directly: API_INTERNAL_URL in Docker, localhost in dev.
 */
const link = new RPCLink({
  url: () =>
    typeof window === "undefined"
      ? `${process.env.API_INTERNAL_URL ?? "http://127.0.0.1:3001"}/api/rpc`
      : `${window.location.origin}/api/rpc`,
});

export const orpc: ContractRouterClient<ORPC> = createORPCClient(link);
