import admin from 'firebase-admin';
import crypto from 'crypto';

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
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    // Flutterwave sends a signature in headers to verify authenticity
    const signature = req.headers['verif-hash'] || '';
    const bodyString = JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac('sha256', process.env.FLW_SECRET_KEY)
      .update(bodyString)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.warn('Webhook signature mismatch!');
      return res.status(400).send('Invalid signature');
    }

    const event = req.body;

    // Example: successful payment
    if (
      event.event === 'charge.completed' &&
      event.data.status === 'successful'
    ) {
      const txRef = event.data.tx_ref;
      const transactionId = event.data.id;
      const currency = event.data.currency;
      const amount = event.data.amount;

      // TODO: Map txRef to your order/quote in Firestore
      // Example: find the quote/order by txRef
      const orderSnapshot = await db
        .collection('brands')
        .doc('serac')
        .collection('quotes')
        .where('tx_ref', '==', txRef)
        .limit(1)
        .get();

      if (!orderSnapshot.empty) {
        const orderDoc = orderSnapshot.docs[0];
        await orderDoc.ref.update({
          status: 'Paid',
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
          transactionId,
          amount,
          currency,
        });
        console.log(`Order updated for tx_ref: ${txRef}`);
      } else {
        console.warn(`No order found for tx_ref: ${txRef}`);
        // Optional: create new record if needed
      }
    }

    res.status(200).send('Webhook received');
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).send(err.message);
  }
}
