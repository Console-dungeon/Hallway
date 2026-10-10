import { oc } from "@orpc/contract";
import { z } from "zod";

/** Response body of GET /api/health. */
export const healthResponseSchema = z.object({
  status: z.enum(["ok", "degraded"]),
  database: z.enum(["up", "down"]),
  uptime: z.number().describe("Process uptime in seconds"),
  timestamp: z.iso.datetime(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const healthContract = oc
  .route({
    method: "GET",
    path: "/health",
    tags: ["system"],
    summary: "Application and database health check",
  })
  // A successful oRPC response can't be 5xx, so "degraded" is a typed error carrying the same body
  .errors({
    SERVICE_UNAVAILABLE: {
      status: 503,
      message: "Database is unreachable",
      data: healthResponseSchema,
    },
  })
  .output(healthResponseSchema);
