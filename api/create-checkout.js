const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // CORS headers for your Coderick domain
  res.setHeader('Access-Control-Allow-Origin', 'https://thierryrivette.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { bookingId, customerEmail, customerName, items, totalAmount } = req.body;

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: { name: item.name },
          unit_amount: Math.round(item.price * 100), // cents
        },
        quantity: 1,
      })),
      mode: 'payment',
      success_url: `https://thierryrivette.com/portal?payment=success&booking=${bookingId}`,
      cancel_url: `https://thierryrivette.com/portal?payment=cancelled&booking=${bookingId}`,
      customer_email: customerEmail,
      metadata: {
        bookingId,
        customerName,
      },
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
}
