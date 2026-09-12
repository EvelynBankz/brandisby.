import { z } from "zod";

// Extend this schema as each provider integration lands (DATABASE_URL in M0.2,
// Clerk keys in M0.3, Paystack/R2/Resend keys in their own milestones). Keeping
// everything behind this one module is what makes `process.env.X` sprinkled
// through the app avoidable per the architecture brief's config-management rule.
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
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
