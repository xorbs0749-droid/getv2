import Stripe from "stripe";
import { STORAGE_PACKS, StoragePackType } from "./products";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-12-15.clover",
});

export async function createCheckoutSession(
  packType: StoragePackType,
  userId: number,
  userEmail: string,
  userName: string,
  origin: string
) {
  const pack = STORAGE_PACKS[packType];

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: pack.currency,
          product_data: {
            name: pack.name,
            description: pack.description,
          },
          unit_amount: pack.price,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/storage-packs`,
    customer_email: userEmail,
    client_reference_id: userId.toString(),
    metadata: {
      user_id: userId.toString(),
      customer_email: userEmail,
      customer_name: userName,
      pack_type: packType,
    },
    allow_promotion_codes: true,
  });

  return session;
}

export { stripe };
