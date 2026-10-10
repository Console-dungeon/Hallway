import { oc } from "@orpc/contract";
import { z } from "zod";

export const authMethodsSchema = z.object({
  github: z.boolean().describe("Whether GitHub sign-in is configured"),
});

export type AuthMethods = z.infer<typeof authMethodsSchema>;

// Sign-in itself is served by Better Auth under /api/auth/*; this contract only covers
// what the web app needs to know around it.
export const authContract = {
  methods: oc
    .route({
      method: "GET",
      path: "/auth-methods",
      tags: ["auth"],
      summary: "Sign-in methods available in this environment",
    })
    .output(authMethodsSchema),
};
