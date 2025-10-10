import admin from 'firebase-admin';

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

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const { transaction_id, tx_ref, quoteId, expectedAmount, currency } = req.body;

    // Build Flutterwave verify URL
    const verifyUrl = transaction_id
      ? `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`
      : `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${tx_ref}`;

    console.log("Calling Flutterwave verify URL:", verifyUrl);

    const verifyRes = await fetch(verifyUrl, {
      headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` },
    });

    const data = await verifyRes.json();

    console.log("Flutterwave response:", data);

    // Extra checks and logging
    if (data.status !== 'success') {
      console.log("Verification failed: Flutterwave returned non-success status");
      return res.status(400).json({ success: false, reason: "Flutterwave verification failed", data });
    }

    if (data.data.amount !== expectedAmount) {
      console.log("Verification failed: Amount mismatch", {
        expected: expectedAmount,
        received: data.data.amount,
      });
      return res.status(400).json({ success: false, reason: "Amount mismatch", data });
    }

    if (data.data.currency !== currency) {
      console.log("Verification failed: Currency mismatch", {
        expected: currency,
        received: data.data.currency,
      });
      return res.status(400).json({ success: false, reason: "Currency mismatch", data });
    }

    // Update Firestore if quoteId exists
    if (quoteId) {
      await db
        .collection('brands')
        .doc('serac')
        .collection('quotes')
        .doc(quoteId)
        .update({
          status: 'Paid',
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      console.log("Firestore quote updated:", quoteId);
    }

    return res.status(200).json({ success: true, data });

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: err.message });
  }
}
