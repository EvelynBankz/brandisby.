import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { categoriesService } from "./categories";

describe("categoriesService", () => {
  const suffix = randomUUID().slice(0, 8);
  const slug = `test-category-${suffix}`;

  afterAll(async () => {
    await getAdminFirestore().collection("categories").doc(slug).delete();
  });

  it("writes and reads back a category by slug", async () => {
    await getAdminFirestore()
      .collection("categories")
      .doc(slug)
      .set({ name: "Test Category", slug });

    const category = await categoriesService.getBySlug(slug);
    expect(category?.name).toBe("Test Category");
  });

  it("returns null for a slug that doesn't exist", async () => {
    expect(await categoriesService.getBySlug("does-not-exist")).toBeNull();
  });
});
