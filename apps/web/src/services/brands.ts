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
};
