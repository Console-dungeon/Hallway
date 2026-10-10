import type { AuthMethods } from "@hallway/shared";
import { safe } from "@orpc/client";

import { client } from "./orpc";

/** Sign-in methods enabled in the API; if the API can't be reached, only the password form shows. */
export async function getAuthMethods(): Promise<AuthMethods> {
  const { data } = await safe(client.auth.methods());
  return data ?? { github: false };
}
