import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { brandsService } from "./brands";

// Integration test: exercises the real service -> Firebase Admin SDK ->
// Firestore chain against the local Firestore Emulator (never the real
// Firebase project) — see package.json's `test` script.
describe("brandsService", () => {
  const suffix = randomUUID().slice(0, 8);
  const featuredSlug = `test-featured-${suffix}`;
  const trendingSlug = `test-trending-${suffix}`;
  const newestSlug = `test-newest-${suffix}`;

  afterAll(async () => {
    const db = getAdminFirestore();
    await Promise.all(
      [featuredSlug, trendingSlug, newestSlug].map((slug) =>
        db.collection("brands").doc(slug).delete(),
      ),
    );
  });

  it("writes and reads back a brand by slug", async () => {
    const db = getAdminFirestore();
    await db
      .collection("brands")
      .doc(featuredSlug)
      .set({
        name: "Test Featured Co",
        slug: featuredSlug,
        description: "A test brand",
        categoryIds: [],
        featured: true,
        trending: false,
        status: "published",
        createdAt: new Date(),
      });

    const brand = await brandsService.getBySlug(featuredSlug);
    expect(brand?.name).toBe("Test Featured Co");
    expect(brand?.status).toBe("published");
  });

  it("returns null for a slug that doesn't exist", async () => {
    expect(await brandsService.getBySlug("does-not-exist")).toBeNull();
  });

  it("lists featured and trending brands separately", async () => {
    const db = getAdminFirestore();
    await db.collection("brands").doc(trendingSlug).set({
      name: "Test Trending Co",
      slug: trendingSlug,
      description: "A trending test brand",
      categoryIds: [],
      featured: false,
      trending: true,
      status: "published",
      createdAt: new Date(),
    });

    const featured = await brandsService.getFeatured(50);
    const trending = await brandsService.getTrending(50);

    expect(featured.some((b) => b.slug === featuredSlug)).toBe(true);
    expect(featured.some((b) => b.slug === trendingSlug)).toBe(false);
    expect(trending.some((b) => b.slug === trendingSlug)).toBe(true);
    expect(trending.some((b) => b.slug === featuredSlug)).toBe(false);
  });

  it("excludes draft brands from public reads", async () => {
    const db = getAdminFirestore();
    await db.collection("brands").doc(newestSlug).set({
      name: "Test Draft Co",
      slug: newestSlug,
      description: "Not published yet",
      categoryIds: [],
      featured: true,
      trending: false,
      status: "draft",
      createdAt: new Date(),
    });

    const featured = await brandsService.getFeatured(50);
    expect(featured.some((b) => b.slug === newestSlug)).toBe(false);
  });
});
