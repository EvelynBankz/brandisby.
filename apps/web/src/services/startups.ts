import "server-only";
import { getAdminFirestore } from "@/lib/firebase/admin";

export interface Startup {
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
  founderIds?: string[];
  instagramUrl?: string;
  xUrl?: string;
  linkedinUrl?: string;
  featured: boolean;
  status: "draft" | "published";
  createdAt: string;
}

const COLLECTION = "startups";

function toStartup(doc: FirebaseFirestore.QueryDocumentSnapshot): Startup {
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
    founderIds: data.founderIds,
    instagramUrl: data.instagramUrl,
    xUrl: data.xUrl,
    linkedinUrl: data.linkedinUrl,
    featured: !!data.featured,
    status: data.status,
    createdAt: createdAt ? createdAt.toDate().toISOString() : new Date(0).toISOString(),
  };
}

export const startupsService = {
  async list(max = 60): Promise<Startup[]> {
    const snap = await getAdminFirestore()
      .collection(COLLECTION)
      .where("status", "==", "published")
      .orderBy("createdAt", "desc")
      .limit(max)
      .get();
    return snap.docs.map(toStartup);
  },

  async getFeatured(max = 6): Promise<Startup[]> {
    const snap = await getAdminFirestore()
      .collection(COLLECTION)
      .where("status", "==", "published")
      .where("featured", "==", true)
      .limit(max)
      .get();
    return snap.docs.map(toStartup);
  },

  async getBySlug(slug: string): Promise<Startup | null> {
    const snap = await getAdminFirestore()
      .collection(COLLECTION)
      .where("slug", "==", slug)
      .limit(1)
      .get();
    return snap.empty ? null : toStartup(snap.docs[0]!);
  },
};
