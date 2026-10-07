import { sql } from "@hallway/db";
import { healthResponseSchema, type HealthResponse } from "@hallway/shared";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

export const healthRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/health",
    {
      schema: {
        tags: ["system"],
        summary: "Application and database health check",
        response: { 200: healthResponseSchema, 503: healthResponseSchema },
      },
    },
    async (request, reply) => {
      let database: HealthResponse["database"] = "up";
      try {
        await app.db.execute(sql`select 1`);
      } catch (error) {
        request.log.error(error, "Database health check failed");
        database = "down";
      }

      return reply.code(database === "up" ? 200 : 503).send({
        status: database === "up" ? "ok" : "degraded",
        database,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      });
    },
  );
};
