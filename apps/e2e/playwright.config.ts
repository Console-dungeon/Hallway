import { existsSync } from "node:fs";
import path from "node:path";

import { defineConfig, devices } from "@playwright/test";

import { AUTH_FILE } from "./support/paths";

const root = path.resolve(import.meta.dirname, "../..");

// Same variables the apps use (DATABASE_URL for cleanup, ports, …)
const rootEnv = path.join(root, ".env");
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./tests",
  // Every test creates its own data, so files and tests can run side by side
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  ...(isCI && { workers: 2 }),
  reporter: isCI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  globalTeardown: "./global-teardown.ts",

  use: {
    baseURL,
    locale: "pl-PL",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    // Runs first: signs in once and saves the session for all other tests
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
      use: {
        ...(process.env.E2E_BROWSER_CHANNEL && {
          channel: process.env.E2E_BROWSER_CHANNEL,
        }),
      },
    },
    {
      name: "chromium",
      dependencies: ["setup"],
      // Tests start signed in. A test of the signed-out app opts out with
      // `test.use({ storageState: SIGNED_OUT })`.
      use: {
        ...devices["Desktop Chrome"],
        storageState: AUTH_FILE,
        // E2E_BROWSER_CHANNEL=chrome runs the tests in an installed Google Chrome
        // instead of the Chromium downloaded by `playwright install`
        ...(process.env.E2E_BROWSER_CHANNEL && {
          channel: process.env.E2E_BROWSER_CHANNEL,
        }),
      },
    },
  ],

  // Starts web + api if they aren't running yet; locally an open `pnpm dev` is reused
  webServer: {
    command: "pnpm dev",
    cwd: root,
    url: `${baseURL}/api/health`,
    reuseExistingServer: !isCI,
    timeout: 180_000,
    stdout: "pipe",
  },
});
