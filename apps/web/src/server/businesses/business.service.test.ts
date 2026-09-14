import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/server/db/client";
import {
  businessService,
  InvalidBusinessInputError,
  SlugTakenError,
} from "./business.service";

// Integration test: exercises the real UI -> service -> repository -> Prisma
// -> PostgreSQL chain against DATABASE_URL. Requires a reachable Postgres
// with the schema migrated (see docs/local-development notes in the roadmap).
describe("businessService", () => {
  const slug = `test-biz-${randomUUID().slice(0, 8)}`;
  const ownerEmail = `owner-${randomUUID()}@example.com`;
  let ownerId: string;

  afterAll(async () => {
    await prisma.business.deleteMany({ where: { slug } });
    await prisma.user.deleteMany({ where: { email: ownerEmail } });
    await prisma.$disconnect();
  });

  it("registers a business, creates an owner membership, and reports the slug as taken", async () => {
    const owner = await prisma.user.create({
      data: { authProvider: "firebase", authProviderUserId: randomUUID(), email: ownerEmail },
    });
    ownerId = owner.id;

    expect(await businessService.isSlugAvailable(slug)).toBe(true);

    const business = await businessService.registerBusiness({
      ownerId,
      name: "Test Business",
      slug,
      brandColor: "#2B2118",
      description: "A test business",
    });

    expect(business.slug).toBe(slug);
    expect(await businessService.isSlugAvailable(slug)).toBe(false);

    const membership = await prisma.businessMembership.findUnique({
      where: { userId_businessId: { userId: ownerId, businessId: business.id } },
    });
    expect(membership?.role).toBe("OWNER");
  });

  it("rejects registering an already-taken slug", async () => {
    await expect(
      businessService.registerBusiness({ ownerId, name: "Duplicate", slug }),
    ).rejects.toThrow(SlugTakenError);
  });

  it("normalizes handles before checking availability", async () => {
    const result = await businessService.checkSlug("  My New Store!! ");
    expect(result.normalized).toBe("my-new-store");
    expect(result.available).toBe(true);
  });

  it("rejects reserved handles", async () => {
    const result = await businessService.checkSlug("dashboard");
    expect(result.available).toBe(false);
    expect(result.error).toMatch(/reserved/i);
  });

  it("rejects invalid business input before touching the database", async () => {
    await expect(
      businessService.registerBusiness({ ownerId, name: "A", slug: "valid-handle" }),
    ).rejects.toThrow(InvalidBusinessInputError);
  });
});
