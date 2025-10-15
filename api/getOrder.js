import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { trackingRef, brandId } = req.body;
  if (!trackingRef || !brandId) return res.status(400).json({ error: "Missing parameters" });

  try {
    const snapshot = await db
      .collection("brands")
      .doc(brandId)
      .collection("orders")
      .where("trackingRef", "==", trackingRef)
      .get();

    if (snapshot.empty) return res.status(200).json({ found: false });

    const order = snapshot.docs[0].data();
    res.status(200).json({ found: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}
