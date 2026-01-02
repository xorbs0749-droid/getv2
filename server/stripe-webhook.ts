import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { createStoragePack } from './db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    console.error('[Webhook] Missing stripe-signature header');
    return res.status(400).send('Missing signature');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('[Webhook] Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle test events
  if (event.id.startsWith('evt_test_')) {
    console.log('[Webhook] Test event detected, returning verification response');
    return res.json({ 
      verified: true,
    });
  }

  console.log('[Webhook] Received event:', event.type, event.id);

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('[Webhook] Checkout session completed:', session.id);

      // Extract user information from metadata
      const userId = session.metadata?.user_id;
      const packType = session.metadata?.pack_type;

      if (!userId || !packType) {
        console.error('[Webhook] Missing required metadata:', { userId, packType });
        break;
      }

      // Create storage pack record
      try {
        await createStoragePack({
          userId: Number(userId),
          packType,
          stripeSessionId: session.id,
        });
        console.log('[Webhook] Storage pack created for user:', userId);
      } catch (error) {
        console.error('[Webhook] Failed to create storage pack:', error);
      }
      break;
    }

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('[Webhook] Payment succeeded:', paymentIntent.id);
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('[Webhook] Payment failed:', paymentIntent.id);
      break;
    }

    default:
      console.log('[Webhook] Unhandled event type:', event.type);
  }

  res.json({ received: true });
}
