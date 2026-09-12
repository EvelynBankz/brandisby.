import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/server/db/client";
import { businessService, SlugTakenError } from "./business.service";

// Integration test: exercises the real UI -> service -> repository -> Prisma
// -> PostgreSQL chain against DATABASE_URL. Requires a reachable Postgres
// with the schema migrated (see docs/local-development notes in the roadmap).
describe("businessService", () => {
  const slug = `test-business-${randomUUID()}`;

  afterAll(async () => {
    await prisma.business.deleteMany({ where: { slug } });
    await prisma.$disconnect();
  });

  it("registers a business and reports its slug as taken", async () => {
    expect(await businessService.isSlugAvailable(slug)).toBe(true);

    const business = await businessService.registerBusiness({
      name: "Test Business",
      slug,
    });

    expect(business.slug).toBe(slug);
    expect(await businessService.isSlugAvailable(slug)).toBe(false);
  });

  it("rejects registering an already-taken slug", async () => {
    await expect(
      businessService.registerBusiness({ name: "Duplicate", slug }),
    ).rejects.toThrow(SlugTakenError);
  });
});
