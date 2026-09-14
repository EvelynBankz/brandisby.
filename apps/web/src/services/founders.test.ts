import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { foundersService } from "./founders";

describe("foundersService", () => {
  const suffix = randomUUID().slice(0, 8);
  const featuredSlug = `test-founder-featured-${suffix}`;
  const draftSlug = `test-founder-draft-${suffix}`;

  afterAll(async () => {
    const db = getAdminFirestore();
    await Promise.all(
      [featuredSlug, draftSlug].map((slug) => db.collection("founders").doc(slug).delete()),
    );
  });

  it("writes and reads back a founder by slug", async () => {
    const db = getAdminFirestore();
    await db.collection("founders").doc(featuredSlug).set({
      name: "Test Founder",
      slug: featuredSlug,
      bio: "A test founder",
      featured: true,
      status: "published",
      createdAt: new Date(),
    });

    const founder = await foundersService.getBySlug(featuredSlug);
    expect(founder?.name).toBe("Test Founder");

    const featured = await foundersService.getFeatured(50);
    expect(featured.some((f) => f.slug === featuredSlug)).toBe(true);

    const listed = await foundersService.list(50);
    expect(listed.some((f) => f.slug === featuredSlug)).toBe(true);

    const byIds = await foundersService.getByIds([founder!.id]);
    expect(byIds.some((f) => f.slug === featuredSlug)).toBe(true);
  });

  it("returns null for a slug that doesn't exist", async () => {
    expect(await foundersService.getBySlug("does-not-exist")).toBeNull();
  });

  it("excludes draft founders from public reads", async () => {
    const db = getAdminFirestore();
    await db.collection("founders").doc(draftSlug).set({
      name: "Test Draft Founder",
      slug: draftSlug,
      bio: "Not published yet",
      featured: true,
      status: "draft",
      createdAt: new Date(),
    });

    const featured = await foundersService.getFeatured(50);
    expect(featured.some((f) => f.slug === draftSlug)).toBe(false);

    const byIds = await foundersService.getByIds([draftSlug]);
    expect(byIds).toHaveLength(0);
  });
});
