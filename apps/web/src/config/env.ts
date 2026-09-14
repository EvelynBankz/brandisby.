import { z } from "zod";

// Extend this schema as each provider integration lands (Paystack/R2/Resend
// keys in their own milestones). Keeping everything behind this one module is
// what makes `process.env.X` sprinkled through the app avoidable per the
// architecture brief's config-management rule.
//
// DIRECT_DATABASE_URL (the unpooled connection Prisma Migrate needs) is read
// directly by the Prisma CLI via prisma7.config.ts, not through this module —
// the running app only ever queries through the pooled DATABASE_URL.
//
// FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY are only required when talking
// to a real Firebase project — the Auth emulator (dev/test, selected by
// setting FIREBASE_AUTH_EMULATOR_HOST) needs only a project ID.
//
// NEXT_PUBLIC_FIREBASE_* are validated here (so a missing one fails the
// server boot), but the *browser* bundle only gets a value when the literal
// `process.env.NEXT_PUBLIC_X` expression appears in client code — see
// src/lib/firebase-client.ts, which reads these directly rather than via
// this `env` object, because Next's build-time inlining doesn't follow
// re-exports through `envSchema.safeParse(process.env)`.
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  FIREBASE_PROJECT_ID: z.string().min(1, "FIREBASE_PROJECT_ID is required"),
  FIREBASE_CLIENT_EMAIL: z.string().min(1).optional(),
  FIREBASE_PRIVATE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1, "NEXT_PUBLIC_FIREBASE_API_KEY is required"),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z
    .string()
    .min(1, "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is required"),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z
    .string()
    .min(1, "NEXT_PUBLIC_FIREBASE_PROJECT_ID is required"),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1, "NEXT_PUBLIC_FIREBASE_APP_ID is required"),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error(
      "Invalid environment configuration:",
      z.treeifyError(parsed.error),
    );
    throw new Error(
      "Invalid environment configuration — see the errors logged above.",
    );
  }

  return parsed.data;
}

export const env = loadEnv();
