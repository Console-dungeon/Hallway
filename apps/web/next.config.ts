import path from "node:path";

import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import type { NextConfig } from "next";

// Must match API_HOST/API_PORT defaults in apps/api/src/env.ts
const DEV_API_ORIGIN = "http://127.0.0.1:3001";

export default function config(phase: string): NextConfig {
  return {
    // Self-contained server in .next/standalone, used by the production Docker image
    output: "standalone",
    // Trace files from the monorepo root so workspace packages end up in the standalone build
    outputFileTracingRoot: path.join(import.meta.dirname, "../../"),
    // On servers Caddy routes /api/* to the API. In dev Next proxies it, so web and
    // API share one origin and auth cookies work the same way as in production.
    ...(phase === PHASE_DEVELOPMENT_SERVER && {
      rewrites: async () => [
        { source: "/api/:path*", destination: `${DEV_API_ORIGIN}/api/:path*` },
      ],
    }),
  };
}
