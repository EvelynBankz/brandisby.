import crypto from "crypto";
import admin from "firebase-admin";

// Initialize Firestore admin SDK (reuse connection if already set)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ status: "error", message: "Method not allowed" });
  }

  try {
    const secretHash = process.env.FLW_WEBHOOK_SECRET; // Set this in your Flutterwave dashboard and Vercel env
    const signature = req.headers["verif-hash"];

    if (!signature || signature !== secretHash) {
      console.warn("⚠️ Invalid webhook signature. Possible spoofed call.");
      return res.status(401).json({ status: "error", message: "Unauthorized webhook" });
    }

    const event = req.body;

    if (!event || !event.data) {
      return res.status(400).json({ status: "error", message: "Invalid payload" });
    }

    const data = event.data;
    const transaction_id = data.id;
    const tx_ref = data.tx_ref;

    // Process only successful transactions
    if (data.status !== "successful") {
      console.log(`Ignoring non-successful transaction ${transaction_id}`);
      return res.status(200).json({ status: "ignored" });
    }

    const ordersRef = db.collection("brands").doc("serac").collection("orders");

    // Check for duplicate
    const existing = await ordersRef.where("transaction_id", "==", transaction_id).limit(1).get();
    if (!existing.empty) {
      console.log("Duplicate webhook ignored: ", transaction_id);
      return res.status(200).json({ status: "duplicate" });
    }

    const orderPayload = {
      transaction_id,
      tx_ref,
      amount: data.amount,
      currency: data.currency,
      status: "paid",
      source: "webhook",
      payment_type: data.payment_type || "unknown",
      flutterwave_response: data,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const newOrder = await ordersRef.add(orderPayload);

    // Update matching quote if tx_ref links to it
    if (tx_ref && tx_ref.startsWith("quote_")) {
      const quoteId = tx_ref.replace("quote_", "");
      try {
        await db.collection("brands").doc("serac").collection("quotes").doc(quoteId).update({
          status: "Paid",
          orderId: newOrder.id,
          paidAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (e) {
        console.warn("Quote update failed in webhook:", e.message);
      }
    }

    console.log(`✅ Webhook verified and recorded for tx_ref: ${tx_ref}`);
    return res.status(200).json({ status: "success" });
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).json({ status: "error", message: err.message });
  }
}
