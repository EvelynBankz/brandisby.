import "server-only";
import { getAdminFirestore } from "@/lib/firebase/admin";

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

const COLLECTION = "categories";

function toCategory(doc: FirebaseFirestore.QueryDocumentSnapshot): Category {
  const data = doc.data();
  return { id: doc.id, name: data.name, slug: data.slug, icon: data.icon };
}

export const categoriesService = {
  async list(): Promise<Category[]> {
    const snap = await getAdminFirestore().collection(COLLECTION).orderBy("name").get();
    return snap.docs.map(toCategory);
  },

  async getBySlug(slug: string): Promise<Category | null> {
    const snap = await getAdminFirestore()
      .collection(COLLECTION)
      .where("slug", "==", slug)
      .limit(1)
      .get();
    return snap.empty ? null : toCategory(snap.docs[0]!);
  },
};
