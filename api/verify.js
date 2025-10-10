import admin from 'firebase-admin';
// Vercel allows fetch but explicit import is fine

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  console.log("Received payload from client:", req.body);

  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const { transaction_id, tx_ref, quoteId, expectedAmount } = req.body;

    const verifyUrl = transaction_id
      ? `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`
      : `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${tx_ref}`;

    const verifyRes = await fetch(verifyUrl, {
      headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` },
    });
    const data = await verifyRes.json();

    if (data.status === 'success' && data.data.amount === expectedAmount) {
      await db.collection('brands').doc('serac').collection('quotes').doc(quoteId).update({
        status: 'Paid',
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.status(200).json({ success: true, data });
    } else {
      return res.status(400).json({ success: false, data });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
