import type { ORPC } from "@hallway/shared";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import { cookies } from "next/headers";

import { serverApiOrigin } from "./api-origin";

/**
 * API client for server components: calls the API directly and forwards the visitor's
 * cookies, so protected procedures see their session. Client components use `lib/orpc.ts`.
 */
const link = new RPCLink({
  url: `${serverApiOrigin}/api/rpc`,
  headers: async () => ({ cookie: (await cookies()).toString() }),
});

export const serverClient: ContractRouterClient<ORPC> = createORPCClient(link);
