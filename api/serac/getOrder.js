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

const convertTimestamp = (t) => {
  if (!t) return null;
  if (t.toDate) return t.toDate().toISOString();
  if (t.seconds) return new Date(t.seconds * 1000).toISOString();
  return new Date(t).toISOString();
};

export default async function handler(req, res) {
  let trackingRef;

  if (req.method === "GET") {
    trackingRef = req.query.trackingRef;
  } else if (req.method === "POST") {
    trackingRef = req.body.trackingRef;
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!trackingRef) return res.status(400).json({ error: "Missing trackingRef" });

  try {
    const snapshot = await db
      .collection("brands")
      .doc("serac")
      .collection("orders")
      .where("trackingRef", "==", trackingRef)
      .get();

    if (snapshot.empty) return res.status(200).json({ found: false });

    const docData = snapshot.docs[0].data();
    const order = {
      ...docData,
      brandId: "serac",
      createdAt: convertTimestamp(docData.createdAt),
      verifiedAt: convertTimestamp(docData.verifiedAt),
      statusHistory: (docData.statusHistory || []).map(h => ({
        ...h,
        changedAt: convertTimestamp(h.changedAt),
      })),
    };

    res.status(200).json({ found: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}
