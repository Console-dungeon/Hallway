import {
  accounts,
  type Database,
  sessions,
  users,
  verifications,
} from "@hallway/db";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@hallway/shared";
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

import { resetPasswordEmail } from "./email-templates/reset-password.js";
import { verificationEmail } from "./email-templates/verification.js";
import type { Env } from "../config/env.js";
import type { Mailer, MailMessage } from "../mail/mailer.js";

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
    // Failed redirects (denied GitHub consent, expired state…) land on our login page
    // as ?error=<code> instead of Better Auth's built-in error page
    onAPIError: { errorURL: `${env.BETTER_AUTH_URL}/login` },
    database: drizzleAdapter(db, {
      provider: "pg",
      usePlural: true,
      schema: { users, sessions, accounts, verifications },
    }),
    // Ids come from the column defaults in Postgres (prefixed: user_…, session_…)
    advanced: { database: { generateId: false } },
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
      minPasswordLength: PASSWORD_MIN_LENGTH,
      maxPasswordLength: PASSWORD_MAX_LENGTH,
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
