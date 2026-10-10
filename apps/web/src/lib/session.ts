import { cookies } from "next/headers";
import { cache } from "react";

import { serverApiOrigin } from "./api-origin";
import type { Session } from "./auth-client";

/**
 * The signed-in user as seen by the API, for server components. This is the real check:
 * the cookie is validated by Better Auth, not just looked at. Cached per request.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const cookie = (await cookies()).toString();
  if (!cookie) return null;

  const response = await fetch(`${serverApiOrigin}/api/auth/get-session`, {
    headers: { cookie },
    cache: "no-store",
  });
  if (!response.ok) {
    // "No session" is a 200 with null; anything else means the API is misconfigured or down
    console.error(
      `Session check failed: ${response.status} from ${serverApiOrigin}`,
    );
    return null;
  }
  // Our own API; the shape is the one Better Auth's client is typed with
  return (await response.json()) as Session | null;
});
