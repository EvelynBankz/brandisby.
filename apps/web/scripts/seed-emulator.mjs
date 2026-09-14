// Seeds sample data into the LOCAL FIRESTORE EMULATOR only — never touches
// the real Firebase project. Run the emulators first:
//   npx firebase emulators:start --only auth,firestore --project demo-brandisby
// then, in another terminal:
//   node scripts/seed-emulator.mjs
import "dotenv/config";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error(
    "FIRESTORE_EMULATOR_HOST is not set — refusing to run against a real project.",
  );
  process.exit(1);
}

initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID ?? "demo-brandisby" });
const db = getFirestore();

const categories = [
  { slug: "beauty", name: "Beauty" },
  { slug: "wellness", name: "Wellness" },
  { slug: "technology", name: "Technology" },
  { slug: "fashion", name: "Fashion" },
  { slug: "lifestyle", name: "Lifestyle" },
];

const brands = [
  {
    name: "Fleur De Vie",
    slug: "fleur-de-vie",
    tagline: "Radiant skin. A more confident you.",
    description: "Skincare rooted in African botanicals.",
    categoryIds: ["beauty"],
    location: "Lagos, Nigeria",
    featured: true,
    trending: true,
    status: "published",
  },
  {
    name: "Sérac",
    slug: "serac",
    tagline: "Small rituals. A calmer, brighter you.",
    description: "Everyday wellness essentials for modern living.",
    categoryIds: ["wellness"],
    location: "Lagos, Nigeria",
    featured: true,
    trending: false,
    status: "published",
  },
  {
    name: "Evelyn Bankz",
    slug: "evelyn-bankz",
    tagline: "Ideas, content and creative projects in motion.",
    description: "Practical knowledge for what's next.",
    categoryIds: ["technology", "lifestyle"],
    location: "Lagos, Nigeria",
    featured: true,
    trending: true,
    status: "published",
  },
];

async function seed() {
  for (const category of categories) {
    await db.collection("categories").doc(category.slug).set(category);
  }
  console.log(`Seeded ${categories.length} categories.`);

  for (const brand of brands) {
    await db
      .collection("brands")
      .doc(brand.slug)
      .set({ ...brand, createdAt: Timestamp.now() });
  }
  console.log(`Seeded ${brands.length} brands.`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
