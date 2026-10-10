import { z } from "zod";

const optionalString = z
  .string()
  .optional()
  .transform((value) => value || undefined);

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  // In Docker (prod) set API_HOST=0.0.0.0; locally listen on loopback only
  API_HOST: z.string().default("127.0.0.1"),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  // Signs session cookies and tokens; generate with `openssl rand -base64 32`
  BETTER_AUTH_SECRET: z.string().min(32),
  // Public origin of the app (web and /api share it), e.g. https://hallway.pl
  BETTER_AUTH_URL: z.url({ protocol: /^https?$/ }),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535),
  // Empty for Mailpit; Docker Compose passes unset variables as ""
  SMTP_USER: optionalString,
  SMTP_PASSWORD: optionalString,
  SMTP_FROM: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

/** Validates environment variables; exits with a readable message when something is wrong. */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    console.error(
      `Invalid environment variables:\n${z.prettifyError(result.error)}`,
    );
    process.exit(1);
  }
  return result.data;
}
