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

const founders = [
  {
    name: "Amara Chukwu",
    slug: "amara-chukwu",
    role: "Founder, Fleur De Vie",
    bio: "Amara started Fleur De Vie after years of formulating skincare for friends and family.",
    brandIds: ["fleur-de-vie"],
    location: "Lagos, Nigeria",
    featured: true,
    status: "published",
  },
  {
    name: "Tomiwa Adeyemi",
    slug: "tomiwa-adeyemi",
    role: "Founder, Sérac",
    bio: "Tomiwa built Sérac around a simple idea: wellness should fit into a real, busy life.",
    brandIds: ["serac"],
    location: "Lagos, Nigeria",
    featured: true,
    status: "published",
  },
];

const startups = [
  {
    name: "PayLink",
    slug: "paylink",
    tagline: "Payments infrastructure for African merchants.",
    description: "PayLink helps small businesses accept payments online and in person.",
    categoryIds: ["technology"],
    location: "Lagos, Nigeria",
    founderIds: [],
    featured: true,
    status: "published",
  },
  {
    name: "FarmTrack",
    slug: "farmtrack",
    tagline: "Supply chain visibility for smallholder farmers.",
    description: "FarmTrack connects farmers directly with buyers and tracks produce from farm to market.",
    categoryIds: ["technology", "lifestyle"],
    location: "Ibadan, Nigeria",
    founderIds: [],
    featured: true,
    status: "published",
  },
];

const creators = [
  {
    name: "Chidinma Vibes",
    slug: "chidinma-vibes",
    tagline: "Style, culture, and everyday Lagos life.",
    bio: "Chidinma covers style and culture across Lagos through video and photo essays.",
    categoryIds: ["fashion", "lifestyle"],
    location: "Lagos, Nigeria",
    featured: true,
    status: "published",
  },
  {
    name: "Lagos Foodie",
    slug: "lagos-foodie",
    tagline: "Finding Nigeria's best food, one plate at a time.",
    bio: "A running guide to the restaurants, street food, and home cooks worth knowing about.",
    categoryIds: ["lifestyle"],
    location: "Lagos, Nigeria",
    featured: true,
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
      .collection("discoveryBrands")
      .doc(brand.slug)
      .set({ ...brand, createdAt: Timestamp.now() });
  }
  console.log(`Seeded ${brands.length} brands.`);

  for (const founder of founders) {
    await db
      .collection("founders")
      .doc(founder.slug)
      .set({ ...founder, createdAt: Timestamp.now() });
  }
  console.log(`Seeded ${founders.length} founders.`);

  for (const startup of startups) {
    await db
      .collection("startups")
      .doc(startup.slug)
      .set({ ...startup, createdAt: Timestamp.now() });
  }
  console.log(`Seeded ${startups.length} startups.`);

  for (const creator of creators) {
    await db
      .collection("creators")
      .doc(creator.slug)
      .set({ ...creator, createdAt: Timestamp.now() });
  }
  console.log(`Seeded ${creators.length} creators.`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
