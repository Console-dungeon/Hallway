import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server in .next/standalone, used by the production Docker image
  output: "standalone",
  // Trace files from the monorepo root so workspace packages end up in the standalone build
  outputFileTracingRoot: path.join(import.meta.dirname, "../../"),
};

export default nextConfig;
