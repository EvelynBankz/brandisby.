import "server-only";
import { getAdminFirestore } from "@/lib/firebase/admin";

export interface Brand {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  description: string;
  story?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  categoryIds: string[];
  location?: string;
  websiteUrl?: string;
  shopUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  xUrl?: string;
  linkedinUrl?: string;
  whatsappUrl?: string;
  physicalAddress?: string;
  founderIds?: string[];
  featured: boolean;
  trending: boolean;
  status: "draft" | "published";
  createdAt: string;
}

const COLLECTION = "brands";

// Case- and diacritic-insensitive comparison, so searching "serac" still
// finds "Sérac".
function normalizeForSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function toBrand(doc: FirebaseFirestore.QueryDocumentSnapshot): Brand {
  const data = doc.data();
  const createdAt = data.createdAt as FirebaseFirestore.Timestamp | undefined;
  return {
    id: doc.id,
    name: data.name,
    slug: data.slug,
    tagline: data.tagline,
    description: data.description,
    story: data.story,
    logoUrl: data.logoUrl,
    coverImageUrl: data.coverImageUrl,
    categoryIds: data.categoryIds ?? [],
    location: data.location,
    websiteUrl: data.websiteUrl,
    shopUrl: data.shopUrl,
    instagramUrl: data.instagramUrl,
    tiktokUrl: data.tiktokUrl,
    xUrl: data.xUrl,
    linkedinUrl: data.linkedinUrl,
    whatsappUrl: data.whatsappUrl,
    physicalAddress: data.physicalAddress,
    founderIds: data.founderIds,
    featured: !!data.featured,
    trending: !!data.trending,
    status: data.status,
    createdAt: createdAt ? createdAt.toDate().toISOString() : new Date(0).toISOString(),
  };
}

// Server-only (Admin SDK) — every read here is for public pages (Server
// Components), so it bypasses firestore.rules by design; admin-only
// mutations land in a later milestone alongside the internal admin panel.
export const brandsService = {
  async getFeatured(max = 6): Promise<Brand[]> {
    const snap = await getAdminFirestore()
      .collection(COLLECTION)
      .where("status", "==", "published")
      .where("featured", "==", true)
      .limit(max)
      .get();
    return snap.docs.map(toBrand);
  },

  async getTrending(max = 6): Promise<Brand[]> {
    const snap = await getAdminFirestore()
      .collection(COLLECTION)
      .where("status", "==", "published")
      .where("trending", "==", true)
      .limit(max)
      .get();
    return snap.docs.map(toBrand);
  },

  async getNewest(max = 6): Promise<Brand[]> {
    const snap = await getAdminFirestore()
      .collection(COLLECTION)
      .where("status", "==", "published")
      .orderBy("createdAt", "desc")
      .limit(max)
      .get();
    return snap.docs.map(toBrand);
  },

  async getBySlug(slug: string): Promise<Brand | null> {
    const snap = await getAdminFirestore()
      .collection(COLLECTION)
      .where("slug", "==", slug)
      .limit(1)
      .get();
    return snap.empty ? null : toBrand(snap.docs[0]!);
  },

  // Backs the Discover page (brief §6: search, category, location, featured,
  // newest — deliberately not overbuilt beyond that). Firestore has no
  // full-text search, so `q`/`location` are filtered in memory over a
  // Firestore-side page of published brands.
  async search(params: BrandSearchParams = {}): Promise<Brand[]> {
    let query: FirebaseFirestore.Query = getAdminFirestore()
      .collection(COLLECTION)
      .where("status", "==", "published");

    if (params.categoryId) {
      query = query.where("categoryIds", "array-contains", params.categoryId);
    }
    if (params.featured) {
      query = query.where("featured", "==", true);
    }
    query = query.orderBy("createdAt", "desc").limit(params.max ?? 60);

    const snap = await query.get();
    let brands = snap.docs.map(toBrand);

    if (params.q) {
      const q = normalizeForSearch(params.q);
      brands = brands.filter(
        (b) =>
          normalizeForSearch(b.name).includes(q) ||
          (b.tagline && normalizeForSearch(b.tagline).includes(q)) ||
          normalizeForSearch(b.description).includes(q),
      );
    }
    if (params.location) {
      const location = normalizeForSearch(params.location);
      brands = brands.filter(
        (b) => b.location && normalizeForSearch(b.location).includes(location),
      );
    }

    return brands;
  },
};

export interface BrandSearchParams {
  q?: string;
  categoryId?: string;
  location?: string;
  featured?: boolean;
  max?: number;
}
