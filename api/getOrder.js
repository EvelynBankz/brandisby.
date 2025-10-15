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

// Utility to convert Firestore timestamps to ISO strings
const convertTimestamp = (t) => {
  if (!t) return null;
  if (t.toDate) return t.toDate().toISOString(); // Firestore Timestamp
  if (t.seconds) return new Date(t.seconds * 1000).toISOString();
  return new Date(t).toISOString(); // fallback
};

export default async function handler(req, res) {
  let trackingRef, brandId;

  // Handle GET and POST
  if (req.method === "GET") {
    trackingRef = req.query.trackingRef;
    brandId = req.query.brandId; // optional
  } else if (req.method === "POST") {
    trackingRef = req.body.trackingRef;
    brandId = req.body.brandId; // optional
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!trackingRef) return res.status(400).json({ error: "Missing trackingRef" });

  try {
    const brandsToCheck = brandId ? [brandId] : ["serac", "fleurdevie"];
    let order = null;

    for (const brand of brandsToCheck) {
      const snapshot = await db
        .collection("brands")
        .doc(brand)
        .collection("orders")
        .where("trackingRef", "==", trackingRef)
        .get();

      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data();

        // Convert timestamps
        const convertedOrder = {
          ...docData,
          brandId: brand,
          createdAt: convertTimestamp(docData.createdAt),
          verifiedAt: convertTimestamp(docData.verifiedAt),
          statusHistory: (docData.statusHistory || []).map(h => ({
            ...h,
            changedAt: convertTimestamp(h.changedAt)
          }))
        };

        order = convertedOrder;
        break;
      }
    }

    if (!order) return res.status(200).json({ found: false });

    res.status(200).json({ found: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}
