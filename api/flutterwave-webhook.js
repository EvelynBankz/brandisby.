import crypto from "crypto";
import admin from "firebase-admin";

// ✅ Initialize Firebase Admin once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      project_id: process.env.FIREBASE_PROJECT_ID,
    }),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ status: "error", message: "Method not allowed" });

  try {
    // 🛡️ Validate Flutterwave signature (security check)
    const secretHash = process.env.FLW_WEBHOOK_SECRET;
    const signature = req.headers["verif-hash"];

    if (!signature || signature !== secretHash) {
      console.warn("⚠️ Invalid Flutterwave webhook signature");
      return res.status(401).json({ status: "error", message: "Invalid signature" });
    }

    // 🧾 Parse webhook body
    const event = req.body;
    if (!event?.data) {
      return res.status(400).json({ status: "error", message: "Invalid webhook payload" });
    }

    const data = event.data;
    const transactionId = data.id;
    const txRef = data.tx_ref;
    const status = data.status?.toLowerCase();
    const amount = Number(data.amount);
    const currency = data.currency;

    const ordersRef = db.collection("brands").doc("serac").collection("orders");

    // 🛡️ Prevent double processing (idempotent)
    const existing = await ordersRef.where("transaction_id", "==", transactionId).limit(1).get();
    if (!existing.empty) {
      console.log(`ℹ️ Transaction ${transactionId} already processed.`);
      return res.status(200).json({ status: "success", message: "Already processed" });
    }

    // ❌ Ignore failed or pending transactions
    if (status !== "successful") {
      console.warn(`⚠️ Ignoring transaction ${transactionId} with status: ${status}`);
      return res.status(200).json({ status: "ignored", message: "Transaction not successful" });
    }

    // 🧩 Prepare order payload
    const orderPayload = {
      transaction_id: transactionId,
      tx_ref: txRef || "",
      amount,
      currency,
      status: "paid",
      flutterwave_webhook: event,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // 💾 Save new order
    const newOrder = await ordersRef.add(orderPayload);

    // 🔄 Update related quote (if any)
    try {
      const quotesRef = db.collection("brands").doc("serac").collection("quotes");
      const matchingQuote = await quotesRef.where("tx_ref", "==", txRef).limit(1).get();

      if (!matchingQuote.empty) {
        const docId = matchingQuote.docs[0].id;
        await quotesRef.doc(docId).update({
          status: "Paid",
          orderId: newOrder.id,
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`✅ Quote ${docId} marked as Paid`);
      }
    } catch (err) {
      console.warn("⚠️ Quote update failed:", err);
    }

    console.log(`✅ Webhook processed successfully for tx_ref ${txRef}`);
    return res.status(200).json({
      status: "success",
      message: "Webhook processed successfully",
      orderId: newOrder.id,
    });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      details: err.message,
    });
  }
}
