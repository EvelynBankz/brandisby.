import "server-only";
import { getAdminFirestore } from "@/lib/firebase/admin";

export interface Founder {
  id: string;
  name: string;
  slug: string;
  role?: string;
  photoUrl?: string;
  bio: string;
  story?: string;
  brandIds?: string[];
  location?: string;
  websiteUrl?: string;
  instagramUrl?: string;
  xUrl?: string;
  linkedinUrl?: string;
  featured: boolean;
  status: "draft" | "published";
  createdAt: string;
}

const COLLECTION = "founders";

function toFounder(doc: FirebaseFirestore.QueryDocumentSnapshot): Founder {
  const data = doc.data();
  const createdAt = data.createdAt as FirebaseFirestore.Timestamp | undefined;
  return {
    id: doc.id,
    name: data.name,
    slug: data.slug,
    role: data.role,
    photoUrl: data.photoUrl,
    bio: data.bio,
    story: data.story,
    brandIds: data.brandIds,
    location: data.location,
    websiteUrl: data.websiteUrl,
    instagramUrl: data.instagramUrl,
    xUrl: data.xUrl,
    linkedinUrl: data.linkedinUrl,
    featured: !!data.featured,
    status: data.status,
    createdAt: createdAt ? createdAt.toDate().toISOString() : new Date(0).toISOString(),
  };
}

export const foundersService = {
  async list(max = 60): Promise<Founder[]> {
    const snap = await getAdminFirestore()
      .collection(COLLECTION)
      .where("status", "==", "published")
      .orderBy("createdAt", "desc")
      .limit(max)
      .get();
    return snap.docs.map(toFounder);
  },

  async getFeatured(max = 6): Promise<Founder[]> {
    const snap = await getAdminFirestore()
      .collection(COLLECTION)
      .where("status", "==", "published")
      .where("featured", "==", true)
      .limit(max)
      .get();
    return snap.docs.map(toFounder);
  },

  async getBySlug(slug: string): Promise<Founder | null> {
    const snap = await getAdminFirestore()
      .collection(COLLECTION)
      .where("slug", "==", slug)
      .limit(1)
      .get();
    return snap.empty ? null : toFounder(snap.docs[0]!);
  },

  async getByIds(ids: string[]): Promise<Founder[]> {
    if (!ids.length) return [];
    const db = getAdminFirestore();
    const refs = ids.map((id) => db.collection(COLLECTION).doc(id));
    const snaps = await db.getAll(...refs);
    return snaps
      .filter((snap) => snap.exists && snap.data()?.status === "published")
      .map((snap) => toFounder(snap as FirebaseFirestore.QueryDocumentSnapshot));
  },
};
