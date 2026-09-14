import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { startupsService } from "./startups";

describe("startupsService", () => {
  const suffix = randomUUID().slice(0, 8);
  const featuredSlug = `test-startup-featured-${suffix}`;
  const draftSlug = `test-startup-draft-${suffix}`;

  afterAll(async () => {
    const db = getAdminFirestore();
    await Promise.all(
      [featuredSlug, draftSlug].map((slug) => db.collection("startups").doc(slug).delete()),
    );
  });

  it("writes and reads back a startup by slug", async () => {
    const db = getAdminFirestore();
    await db.collection("startups").doc(featuredSlug).set({
      name: "Test Startup Co",
      slug: featuredSlug,
      description: "A test startup",
      categoryIds: [],
      featured: true,
      status: "published",
      createdAt: new Date(),
    });

    const startup = await startupsService.getBySlug(featuredSlug);
    expect(startup?.name).toBe("Test Startup Co");

    const featured = await startupsService.getFeatured(50);
    expect(featured.some((s) => s.slug === featuredSlug)).toBe(true);

    const listed = await startupsService.list(50);
    expect(listed.some((s) => s.slug === featuredSlug)).toBe(true);
  });

  it("returns null for a slug that doesn't exist", async () => {
    expect(await startupsService.getBySlug("does-not-exist")).toBeNull();
  });

  it("excludes draft startups from public reads", async () => {
    const db = getAdminFirestore();
    await db.collection("startups").doc(draftSlug).set({
      name: "Test Draft Startup",
      slug: draftSlug,
      description: "Not published yet",
      categoryIds: [],
      featured: true,
      status: "draft",
      createdAt: new Date(),
    });

    const featured = await startupsService.getFeatured(50);
    expect(featured.some((s) => s.slug === draftSlug)).toBe(false);

    const listed = await startupsService.list(50);
    expect(listed.some((s) => s.slug === draftSlug)).toBe(false);
  });
});
