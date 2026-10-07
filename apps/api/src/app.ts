import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import Fastify from "fastify";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";

import type { Env } from "./env.js";
import { healthRoutes } from "./routes/health.js";

// All routes live under /api, so in production Caddy can route app.<domain>/api/* here
export const API_PREFIX = "/api";

export async function buildApp(env: Env) {
  const app = Fastify({
    logger: { level: env.LOG_LEVEL },
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(fastifySwagger, {
    openapi: {
      info: { title: "Hallway API", version: "0.0.0" },
    },
    transform: jsonSchemaTransform,
  });
  await app.register(fastifySwaggerUi, { routePrefix: `${API_PREFIX}/docs` });

  await app.register(healthRoutes, { prefix: API_PREFIX });

  return app;
}
