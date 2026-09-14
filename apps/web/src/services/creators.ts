import "server-only";
import { getAdminFirestore } from "@/lib/firebase/admin";

export interface Creator {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  bio: string;
  photoUrl?: string;
  coverImageUrl?: string;
  categoryIds?: string[];
  location?: string;
  websiteUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  youtubeUrl?: string;
  xUrl?: string;
  featured: boolean;
  status: "draft" | "published";
  createdAt: string;
}

const COLLECTION = "creators";

function toCreator(doc: FirebaseFirestore.QueryDocumentSnapshot): Creator {
  const data = doc.data();
  const createdAt = data.createdAt as FirebaseFirestore.Timestamp | undefined;
  return {
    id: doc.id,
    name: data.name,
    slug: data.slug,
    tagline: data.tagline,
    bio: data.bio,
    photoUrl: data.photoUrl,
    coverImageUrl: data.coverImageUrl,
    categoryIds: data.categoryIds,
    location: data.location,
    websiteUrl: data.websiteUrl,
    instagramUrl: data.instagramUrl,
    tiktokUrl: data.tiktokUrl,
    youtubeUrl: data.youtubeUrl,
    xUrl: data.xUrl,
    featured: !!data.featured,
    status: data.status,
    createdAt: createdAt ? createdAt.toDate().toISOString() : new Date(0).toISOString(),
  };
}

export const creatorsService = {
  async list(max = 60): Promise<Creator[]> {
    const snap = await getAdminFirestore()
      .collection(COLLECTION)
      .where("status", "==", "published")
      .orderBy("createdAt", "desc")
      .limit(max)
      .get();
    return snap.docs.map(toCreator);
  },

  async getFeatured(max = 6): Promise<Creator[]> {
    const snap = await getAdminFirestore()
      .collection(COLLECTION)
      .where("status", "==", "published")
      .where("featured", "==", true)
      .limit(max)
      .get();
    return snap.docs.map(toCreator);
  },

  async getBySlug(slug: string): Promise<Creator | null> {
    const snap = await getAdminFirestore()
      .collection(COLLECTION)
      .where("slug", "==", slug)
      .limit(1)
      .get();
    return snap.empty ? null : toCreator(snap.docs[0]!);
  },
};
