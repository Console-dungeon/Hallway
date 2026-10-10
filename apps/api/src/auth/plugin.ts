import { fromNodeHeaders } from "better-auth/node";
import type { FastifyPluginAsync } from "fastify";

import type { Auth } from "./auth.js";

interface AuthPluginOptions {
  auth: Auth;
  /** Public origin, used to rebuild the absolute request URL. */
  baseURL: string;
}

/**
 * Hands /api/auth/* (registered under the /api prefix) to Better Auth. These routes are
 * outside oRPC, so they don't appear in /api/docs.
 */
export const authPlugin: FastifyPluginAsync<AuthPluginOptions> = async (
  app,
  { auth, baseURL },
) => {
  app.route({
    method: ["GET", "POST"],
    url: "/auth/*",
    handler: async (request, reply) => {
      const headers = fromNodeHeaders(request.headers);
      // Better Auth rate-limits per client IP, which it reads from proxy headers
      if (!headers.has("x-forwarded-for")) {
        headers.set("x-forwarded-for", request.ip);
      }

      const response = await auth.handler(
        new Request(new URL(request.url, baseURL), {
          method: request.method,
          headers,
          // Fastify has already parsed the JSON body
          ...(request.body !== undefined && {
            body: JSON.stringify(request.body),
          }),
        }),
      );

      reply.status(response.status);
      response.headers.forEach((value, name) => {
        if (name !== "set-cookie") reply.header(name, value);
      });
      // forEach would join several cookies into one invalid header
      const cookies = response.headers.getSetCookie();
      if (cookies.length > 0) reply.header("set-cookie", cookies);

      return reply.send(response.body ? await response.text() : null);
    },
  });
};
