import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier/flat";
import tseslint from "typescript-eslint";

export default defineConfig(
  globalIgnores([
    "**/node_modules/",
    "**/dist/",
    "**/.next/",
    "**/out/",
    "**/.turbo/",
    "**/coverage/",
  ]),
  js.configs.recommended,
  tseslint.configs.recommended,
  // Must stay last: turns off rules that conflict with Prettier formatting
  prettier,
);
