import nextVitals from "eslint-config-next/core-web-vitals";
import { defineConfig, globalIgnores } from "eslint/config";

import base from "./base.js";

// Order matters: `base` comes after `nextVitals` so the typescript-eslint parser
// handles every file (Next's own JS parser breaks @typescript-eslint rules), and
// eslint-config-prettier (last item of `base`) still wins over formatting rules.
// typescript-eslint rules come from `base`, so eslint-config-next/typescript is not needed.
export default defineConfig(
  nextVitals,
  base,
  globalIgnores(["next-env.d.ts"]),
  {
    rules: {
      // Pages Router only – we use the App Router, and the rule looks for pages/ relative
      // to the working directory, which breaks when ESLint runs from the repo root (lint-staged)
      "@next/next/no-html-link-for-pages": "off",
    },
  },
);
