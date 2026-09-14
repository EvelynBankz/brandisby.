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

  it("fetches published brands by ID and excludes drafts/missing IDs", async () => {
    const db = getAdminFirestore();
    const draftId = `test-getbyids-draft-${suffix}`;
    await db.collection("brands").doc(draftId).set({
      name: "Test GetByIds Draft",
      slug: draftId,
      description: "Not published yet",
      categoryIds: [],
      featured: false,
      trending: false,
      status: "draft",
      createdAt: new Date(),
    });

    const byIds = await brandsService.getByIds([featuredSlug, draftId, "does-not-exist"]);
    expect(byIds.some((b) => b.slug === featuredSlug)).toBe(true);
    expect(byIds.some((b) => b.slug === draftId)).toBe(false);
    expect(byIds).toHaveLength(1);
    expect(await brandsService.getByIds([])).toEqual([]);

    await db.collection("brands").doc(draftId).delete();
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

  describe("search", () => {
    const categoryId = `test-category-${suffix}`;
    const matchSlug = `test-search-match-${suffix}`;
    const otherCategorySlug = `test-search-other-category-${suffix}`;
    const draftSlug = `test-search-draft-${suffix}`;
    const accentedSlug = `test-search-accented-${suffix}`;

    afterAll(async () => {
      const db = getAdminFirestore();
      await Promise.all(
        [matchSlug, otherCategorySlug, draftSlug, accentedSlug].map((slug) =>
          db.collection("brands").doc(slug).delete(),
        ),
      );
    });

    it("filters by search text, category, location, and featured together", async () => {
      const db = getAdminFirestore();
      await db.collection("brands").doc(matchSlug).set({
        name: "Amara Skincare",
        slug: matchSlug,
        tagline: "Glow from within",
        description: "Botanical skincare for every skin tone.",
        categoryIds: [categoryId],
        location: "Lagos, Nigeria",
        featured: true,
        trending: false,
        status: "published",
        createdAt: new Date(),
      });
      await db.collection("brands").doc(otherCategorySlug).set({
        name: "Different Category Co",
        slug: otherCategorySlug,
        description: "Not in the target category.",
        categoryIds: ["some-other-category"],
        location: "Lagos, Nigeria",
        featured: true,
        trending: false,
        status: "published",
        createdAt: new Date(),
      });
      await db.collection("brands").doc(draftSlug).set({
        name: "Amara Drafts",
        slug: draftSlug,
        description: "Matches the search text but still a draft.",
        categoryIds: [categoryId],
        location: "Lagos, Nigeria",
        featured: true,
        trending: false,
        status: "draft",
        createdAt: new Date(),
      });

      const byText = await brandsService.search({ q: "amara" });
      expect(byText.some((b) => b.slug === matchSlug)).toBe(true);
      expect(byText.some((b) => b.slug === draftSlug)).toBe(false);

      const byCategory = await brandsService.search({ categoryId });
      expect(byCategory.some((b) => b.slug === matchSlug)).toBe(true);
      expect(byCategory.some((b) => b.slug === otherCategorySlug)).toBe(false);

      const byLocation = await brandsService.search({ location: "lagos" });
      expect(byLocation.some((b) => b.slug === matchSlug)).toBe(true);

      const byFeatured = await brandsService.search({
        categoryId,
        featured: true,
      });
      expect(byFeatured.some((b) => b.slug === matchSlug)).toBe(true);

      await db.collection("brands").doc(accentedSlug).set({
        name: "Sérac Test",
        slug: accentedSlug,
        description: "A brand with an accented name.",
        categoryIds: [],
        featured: false,
        trending: false,
        status: "published",
        createdAt: new Date(),
      });
      const byUnaccentedQuery = await brandsService.search({ q: "serac" });
      expect(byUnaccentedQuery.some((b) => b.slug === accentedSlug)).toBe(true);

      const noMatch = await brandsService.search({ q: "nonexistent brand name" });
      expect(noMatch.some((b) => b.slug === matchSlug)).toBe(false);
    });
  });
});
