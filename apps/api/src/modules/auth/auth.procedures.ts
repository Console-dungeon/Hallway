import { os } from "../../orpc/context.js";

export const methods = os.auth.methods.handler(({ context }) => ({
  // Mirrors the condition that enables the GitHub provider in auth/auth.ts
  github: Boolean(context.env.GH_CLIENT_ID && context.env.GH_CLIENT_SECRET),
}));
