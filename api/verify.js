import fetch from "node-fetch";
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}
const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ status: "error", message: "Method not allowed" });

  try {
    const { transaction_id, tx_ref, expectedAmount, currency, orderData, quoteId } = req.body || {};
    if (!transaction_id) return res.status(400).json({ status: "error", message: "transaction_id required" });

    const ordersRef = db.collection("brands").doc("serac").collection("orders");
    const existing = await ordersRef.where("transaction_id", "==", transaction_id).limit(1).get();

    if (!existing.empty) {
      const doc = existing.docs[0].data();
      return res.status(200).json({ status: "success", verified: true, alreadyProcessed: true, orderDoc: doc });
    }

    const verify = await fetch(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        "Content-Type": "application/json"
      }
    });

    const result = await verify.json();
    if (result.status !== "success" || !result.data)
      return res.status(400).json({ status: "failed", message: "Verification failed", data: result });

    const data = result.data;

    if (data.status !== "successful")
      return res.status(400).json({ status: "failed", message: "Transaction not successful", data });

    if (expectedAmount && Number(data.amount) !== Number(expectedAmount))
      return res.status(400).json({ status: "failed", message: "Amount mismatch", data });

    if (currency && data.currency && currency !== data.currency)
      return res.status(400).json({ status: "failed", message: "Currency mismatch", data });

    const orderPayload = {
      transaction_id,
      tx_ref: tx_ref || data.tx_ref || "",
      amount: data.amount,
      currency: data.currency,
      status: "paid",
      flutterwave_response: data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      ...(orderData || {})
    };

    const newOrder = await ordersRef.add(orderPayload);

    if (quoteId) {
      try {
        await db.collection("brands").doc("serac").collection("quotes").doc(quoteId).update({
          status: "Paid",
          orderId: newOrder.id,
          paidAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (e) {
        console.warn("Quote update failed", e);
      }
    }

    res.status(200).json({ status: "success", verified: true, orderId: newOrder.id, data });
  } catch (err) {
    console.error("Verification error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
}
