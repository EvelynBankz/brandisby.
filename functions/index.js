const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();
const db = admin.firestore();

exports.verifyPayment = functions.https.onRequest(async (req, res) => {
  try {
    const { tx_ref, brand } = req.body;

    if (!tx_ref || !brand) {
      return res.status(400).json({ status: "error", message: "Missing tx_ref or brand" });
    }

    // 🔐 Verify transaction via Flutterwave API
    const response = await axios.get(`https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${tx_ref}`, {
      headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` }
    });

    const payment = response.data.data;

    if (payment.status !== "successful") {
      return res.status(400).json({ status: "failed", message: "Payment not successful" });
    }

    // 🔥 Firestore references based on brand
    const quotesCollection = `${brand}_quotes`;
    const ordersCollection = `${brand}_orders`;

    // Find quote by tx_ref and mark as paid
    const quoteSnapshot = await db.collection(quotesCollection).where("tx_ref", "==", tx_ref).limit(1).get();
    if (quoteSnapshot.empty) {
      return res.status(404).json({ status: "error", message: "Quote not found" });
    }

    const quoteDoc = quoteSnapshot.docs[0];
    await quoteDoc.ref.update({ status: "Paid" });

    // Create order
    const orderData = {
      ...quoteDoc.data(),
      paymentId: payment.id,
      status: "Paid",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const orderRef = await db.collection(ordersCollection).add(orderData);

    // TODO: insert webhook call here to notify other systems

    return res.status(200).json({ status: "success", orderId: orderRef.id });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
});
