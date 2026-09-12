import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// This Prisma version's config only takes a single datasource url (no
// separate directUrl field). Neon's pooled connection string is fine for
// `migrate deploy` in CI/production; if a future `migrate dev` run against a
// live Neon database needs to bypass the pooler, override it per-invocation
// with `prisma migrate dev --url <direct-connection-string>` rather than
// baking a second URL into this file.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
