import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/** Better Auth client for client components; talks to /api/auth on the same origin. */
export const authClient = createAuthClient({
  plugins: [
    // Extra user columns defined in apps/api/src/auth/auth.ts
    inferAdditionalFields({
      user: { notificationsEnabled: { type: "boolean", input: false } },
    }),
  ],
});

export type Session = typeof authClient.$Infer.Session;
