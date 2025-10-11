import admin from "firebase-admin";

// ✅ Initialize Firebase Admin once
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
  if (req.method !== "POST")
    return res.status(405).json({ status: "error", message: "Method not allowed" });

  try {
    const { transaction_id, tx_ref, expectedAmount, currency, orderData, quoteId } = req.body || {};
    if (!transaction_id)
      return res.status(400).json({ status: "error", message: "Missing transaction_id" });

    const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;
    if (!FLW_SECRET_KEY)
      return res.status(500).json({ status: "error", message: "Missing Flutterwave secret key" });

    // 🛡️ Check if already processed (idempotency protection)
    const ordersRef = db.collection("brands").doc("serac").collection("orders");
    const existing = await ordersRef.where("transaction_id", "==", transaction_id).limit(1).get();
    if (!existing.empty) {
      const doc = existing.docs[0].data();
      return res.status(200).json({
        status: "success",
        verified: true,
        alreadyProcessed: true,
        orderDoc: doc
      });
    }

    // 🔍 Verify transaction directly with Flutterwave
    const verifyRes = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const result = await verifyRes.json();
    if (!verifyRes.ok || result.status !== "success" || !result.data) {
      console.error("Flutterwave verify failed:", result);
      return res.status(400).json({ status: "failed", message: "Verification failed", data: result });
    }

    const data = result.data;

    // ✅ Validate transaction details
    if (data.status !== "successful") {
      return res.status(400).json({ status: "failed", message: "Transaction not successful", data });
    }

    if (expectedAmount && Number(data.amount) !== Number(expectedAmount)) {
      return res.status(400).json({ status: "failed", message: "Amount mismatch", data });
    }

    if (currency && data.currency && data.currency !== currency) {
      return res.status(400).json({ status: "failed", message: "Currency mismatch", data });
    }

    // 🧾 Build and save order
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

    const newOrderRef = await ordersRef.add(orderPayload);

    // 🔄 Update quote (if applicable)
    if (quoteId) {
      try {
        await db
          .collection("brands")
          .doc("serac")
          .collection("quotes")
          .doc(quoteId)
          .update({
            status: "Paid",
            orderId: newOrderRef.id,
            paidAt: admin.firestore.FieldValue.serverTimestamp()
          });
      } catch (err) {
        console.warn("Quote update failed:", err);
      }
    }

    console.log("✅ Payment verified & order created:", newOrderRef.id);

    return res.status(200).json({
      status: "success",
      verified: true,
      orderId: newOrderRef.id,
      data
    });
  } catch (err) {
    console.error("Verification error:", err);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      details: err.message
    });
  }
}
