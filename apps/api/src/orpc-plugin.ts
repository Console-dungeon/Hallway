import { OpenAPIHandler } from "@orpc/openapi/fastify";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError, ORPCError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fastify";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import type { FastifyPluginAsync, FastifyRequest } from "fastify";

import type { ApiContext } from "./orpc.js";
import { router } from "./router.js";

function logUnexpectedError(error: unknown, context: ApiContext) {
  // Typed errors from the contract and 4xx (e.g. validation) are expected responses
  if (error instanceof ORPCError && (error.defined || error.status < 500))
    return;
  context.log.error(error, "Unhandled error in oRPC procedure");
}

/**
 * Mounts the oRPC router (registered under the /api prefix):
 * - /api/rpc/*  – RPC protocol for the typed client in apps/web
 * - /api/*      – REST from the contract routes, OpenAPI spec at /api/openapi.json, docs at /api/docs
 * Plain Fastify routes (e.g. Better Auth at /api/auth/*) are more specific and take precedence.
 *
 * Request bodies go through Fastify's default parsers (JSON, text, 1 MiB limit); multipart
 * uploads will need a dedicated parser when we add them.
 */
export const orpcPlugin: FastifyPluginAsync = async (app) => {
  const rpcHandler = new RPCHandler(router, {
    interceptors: [
      onError((error, { context }) => logUnexpectedError(error, context)),
    ],
  });

  const openApiHandler = new OpenAPIHandler(router, {
    interceptors: [
      onError((error, { context }) => logUnexpectedError(error, context)),
    ],
    plugins: [
      new OpenAPIReferencePlugin({
        schemaConverters: [new ZodToJsonSchemaConverter()],
        specPath: "/openapi.json",
        docsPath: "/docs",
        docsTitle: "Hallway API",
        specGenerateOptions: {
          info: { title: "Hallway API", version: "0.0.0" },
          servers: [{ url: "/api" }],
        },
      }),
    ],
  });

  const context = (request: FastifyRequest): ApiContext => ({
    db: app.db,
    log: request.log,
  });

  app.all("/rpc/*", async (request, reply) => {
    const { matched } = await rpcHandler.handle(request, reply, {
      prefix: "/api/rpc",
      context: context(request),
    });
    if (!matched) return reply.callNotFound();
    return reply;
  });

  app.all("/*", async (request, reply) => {
    const { matched } = await openApiHandler.handle(request, reply, {
      prefix: "/api",
      context: context(request),
    });
    if (!matched) return reply.callNotFound();
    return reply;
  });
};
