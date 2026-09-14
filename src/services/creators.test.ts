import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { creatorsService } from "./creators";

describe("creatorsService", () => {
  const suffix = randomUUID().slice(0, 8);
  const featuredSlug = `test-creator-featured-${suffix}`;
  const draftSlug = `test-creator-draft-${suffix}`;

  afterAll(async () => {
    const db = getAdminFirestore();
    await Promise.all(
      [featuredSlug, draftSlug].map((slug) => db.collection("creators").doc(slug).delete()),
    );
  });

  it("writes and reads back a creator by slug", async () => {
    const db = getAdminFirestore();
    await db.collection("creators").doc(featuredSlug).set({
      name: "Test Creator",
      slug: featuredSlug,
      bio: "A test creator",
      featured: true,
      status: "published",
      createdAt: new Date(),
    });

    const creator = await creatorsService.getBySlug(featuredSlug);
    expect(creator?.name).toBe("Test Creator");

    const featured = await creatorsService.getFeatured(50);
    expect(featured.some((c) => c.slug === featuredSlug)).toBe(true);

    const listed = await creatorsService.list(50);
    expect(listed.some((c) => c.slug === featuredSlug)).toBe(true);
  });

  it("returns null for a slug that doesn't exist", async () => {
    expect(await creatorsService.getBySlug("does-not-exist")).toBeNull();
  });

  it("excludes draft creators from public reads", async () => {
    const db = getAdminFirestore();
    await db.collection("creators").doc(draftSlug).set({
      name: "Test Draft Creator",
      slug: draftSlug,
      bio: "Not published yet",
      featured: true,
      status: "draft",
      createdAt: new Date(),
    });

    const featured = await creatorsService.getFeatured(50);
    expect(featured.some((c) => c.slug === draftSlug)).toBe(false);
  });
});
