import { z } from "zod";

// Extend this schema as each provider integration lands (Clerk keys in M0.3,
// Paystack/R2/Resend keys in their own milestones). Keeping everything behind
// this one module is what makes `process.env.X` sprinkled through the app
// avoidable per the architecture brief's config-management rule.
//
// DIRECT_DATABASE_URL (the unpooled connection Prisma Migrate needs) is read
// directly by the Prisma CLI via prisma7.config.ts, not through this module —
// the running app only ever queries through the pooled DATABASE_URL.
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
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
