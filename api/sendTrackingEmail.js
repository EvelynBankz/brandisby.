export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { email, name, trackingRef, type } = req.body;

  try {
    // Example: use your mail service here
    await sendEmail({
      to: email,
      subject: `Your ${type === "quote" ? "Quote" : "Order"} Reference`,
      html: `
        <p>Hi ${name || "there"},</p>
        <p>Thank you for your purchase from Sérac.</p>
        <p>Your tracking reference is <strong>${trackingRef}</strong>.</p>
        <p>You can track your order here: 
        <a href="https://yourdomain.com/trackorder.html?ref=${encodeURIComponent(trackingRef)}">Track Order</a></p>
      `
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Email send error:", error);
    return res.status(500).json({ error: "Email failed" });
  }
}
