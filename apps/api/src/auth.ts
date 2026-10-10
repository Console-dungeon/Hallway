import {
  accounts,
  type Database,
  sessions,
  users,
  verifications,
} from "@hallway/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAccessControl } from "better-auth/plugins/access";
import { admin } from "better-auth/plugins/admin";
import {
  adminAc,
  defaultStatements,
  userAc,
} from "better-auth/plugins/admin/access";
import type { FastifyBaseLogger } from "fastify";

import { resetPasswordEmail, verificationEmail } from "./emails.js";
import type { Env } from "./env.js";
import type { Mailer, MailMessage } from "./mailer.js";

// Platform roles (users.role): `superadmin` gets Better Auth's admin permissions
const accessControl = createAccessControl(defaultStatements);
const roles = {
  user: accessControl.newRole(userAc.statements),
  superadmin: accessControl.newRole(adminAc.statements),
};

interface AuthDeps {
  db: Database;
  env: Env;
  mailer: Mailer;
  log: FastifyBaseLogger;
}

export function createAuth({ db, env, mailer, log }: AuthDeps) {
  // Not awaited by the auth endpoints, so response time doesn't reveal whether an account exists
  const sendInBackground = (message: MailMessage) => {
    mailer.send(message).catch((error: unknown) => {
      log.error(error, "Failed to send auth e-mail");
    });
  };

  return betterAuth({
    appName: "Hallway",
    secret: env.BETTER_AUTH_SECRET,
    // Web and API share one origin; Better Auth lives under /api/auth (default basePath)
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: [env.BETTER_AUTH_URL],
    database: drizzleAdapter(db, {
      provider: "pg",
      usePlural: true,
      schema: { users, sessions, accounts, verifications },
    }),
    // Ids are Postgres uuid columns filled by gen_random_uuid()
    advanced: { database: { generateId: "uuid" } },
    user: {
      additionalFields: {
        notificationsEnabled: {
          type: "boolean",
          defaultValue: true,
          input: false,
        },
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      minPasswordLength: 8,
      sendResetPassword: async ({ user, url }) => {
        sendInBackground({ to: user.email, ...resetPasswordEmail(url) });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      // An unverified user who tries to sign in gets a fresh link
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        sendInBackground({ to: user.email, ...verificationEmail(url) });
      },
    },
    // Callback URL to register in the GitHub OAuth app: <BETTER_AUTH_URL>/api/auth/callback/github
    ...(env.GH_CLIENT_ID &&
      env.GH_CLIENT_SECRET && {
        socialProviders: {
          github: {
            clientId: env.GH_CLIENT_ID,
            clientSecret: env.GH_CLIENT_SECRET,
          },
        },
      }),
    // In-memory counters are enough for a single API instance
    rateLimit: { enabled: true },
    plugins: [
      admin({
        ac: accessControl,
        roles,
        defaultRole: "user",
        adminRoles: ["superadmin"],
      }),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
