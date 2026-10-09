import { sql } from "@hallway/db";
import type { HealthResponse } from "@hallway/shared";

import { os } from "../orpc.js";

export const health = os.system.health.handler(async ({ context, errors }) => {
  let database: HealthResponse["database"] = "up";
  try {
    await context.db.execute(sql`select 1`);
  } catch (error) {
    context.log.error(error, "Database health check failed");
    database = "down";
  }

  const body: HealthResponse = {
    status: database === "up" ? "ok" : "degraded",
    database,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };
  if (database === "down") {
    throw errors.SERVICE_UNAVAILABLE({ data: body });
  }
  return body;
});
