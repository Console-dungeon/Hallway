import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";

const healthResponse = z.object({
  status: z.literal("ok"),
  uptime: z.number().describe("Process uptime in seconds"),
  timestamp: z.iso.datetime(),
});

export const healthRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/health",
    {
      schema: {
        tags: ["system"],
        summary: "Application health check",
        response: { 200: healthResponse },
      },
    },
    async () => ({
      status: "ok" as const,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    }),
  );
};
