import crypto from "crypto";
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      project_id: process.env.FIREBASE_PROJECT_ID
    })
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  try {
    // Flutterwave sends a 'verif-hash' header for security
    const secretHash = process.env.FLW_WEBHOOK_SECRET;
    const signature = req.headers["verif-hash"];

    if (!signature || signature !== secretHash) {
      console.warn("⚠️ Invalid Flutterwave webhook signature");
      return res.status(401).json({ message: "Invalid signature" });
    }

    const event = req.body;
    if (!event || !event.data) {
      return res.status(400).json({ message: "Invalid webhook payload" });
    }

    const data = event.data;
    const transactionId = data.id;
    const txRef = data.tx_ref;
    const status = data.status;
    const amount = Number(data.amount);
    const currency = data.currency;

    // Reference to Firestore collection
    const ordersRef = db.collection("brands").doc("serac").collection("orders");

    // Check if this transaction already exists (idempotent)
    const existing = await ordersRef.where("transaction_id", "==", transactionId).limit(1).get();

    if (!existing.empty) {
      console.log(`✅ Transaction ${transactionId} already processed.`);
      return res.status(200).json({ message: "Already processed" });
    }

    if (status !== "successful") {
      console.warn(`⚠️ Transaction ${transactionId} not successful.`);
      return res.status(200).json({ message: "Ignored: not successful" });
    }

    const orderPayload = {
      transaction_id: transactionId,
      tx_ref: txRef || "",
      amount,
      currency,
      status: "paid",
      flutterwave_webhook: event,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const newOrder = await ordersRef.add(orderPayload);

    // Optional: If tx_ref matches an existing quote, mark it paid
    const quotesRef = db.collection("brands").doc("serac").collection("quotes");
    const matchingQuote = await quotesRef.where("tx_ref", "==", txRef).limit(1).get();

    if (!matchingQuote.empty) {
      const docId = matchingQuote.docs[0].id;
      await quotesRef.doc(docId).update({
        status: "Paid",
        orderId: newOrder.id,
        paidAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    console.log(`✅ Webhook processed for tx_ref ${txRef}`);
    return res.status(200).json({ message: "Webhook received", orderId: newOrder.id });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
}
