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

    if (!transaction_id && !tx_ref) {
      console.log("Verification failed: Missing transaction_id and tx_ref");
      return res.status(400).json({ success: false, reason: "Missing transaction_id or tx_ref" });
    }

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

    if (!data || !data.data) {
      console.log("Verification failed: Invalid response structure from Flutterwave");
      return res.status(400).json({ success: false, reason: "Invalid response structure", data });
    }

    // Check Flutterwave transaction status
    if (data.status !== 'success') {
      console.log("Verification failed: Flutterwave returned non-success status", data);
      return res.status(400).json({ success: false, reason: "Flutterwave status not successful", data });
    }

    // Amount check
    if (Number(data.data.amount) !== Number(expectedAmount)) {
      console.log("Verification failed: Amount mismatch", {
        expected: expectedAmount,
        received: data.data.amount,
      });
      return res.status(400).json({ success: false, reason: "Amount mismatch", data });
    }

    // Currency check
    if ((data.data.currency || '').toUpperCase() !== (currency || '').toUpperCase()) {
      console.log("Verification failed: Currency mismatch", {
        expected: currency,
        received: data.data.currency,
      });
      return res.status(400).json({ success: false, reason: "Currency mismatch", data });
    }

    // Update Firestore quote if exists
    if (quoteId) {
      try {
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
      } catch (err) {
        console.warn("Failed to update Firestore quote:", err);
      }
    }

    return res.status(200).json({ success: true, data });

  } catch (err) {
    console.error("Server error during verification:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
