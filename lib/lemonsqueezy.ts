import "server-only";

import Stripe from "stripe";

export function getStripeClient(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return null;
  }

  return new Stripe(secretKey);
}

export function verifyStripeWebhookEvent(rawBody: string, signature: string): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripe = getStripeClient();

  if (!secret || !stripe) {
    throw new Error("Stripe webhook environment variables are not configured.");
  }

  return stripe.webhooks.constructEvent(rawBody, signature, secret);
}

export interface StripeCheckoutEntitlement {
  email: string;
  customerId?: string;
  checkoutSessionId?: string;
}

export function entitlementFromCheckoutSession(
  session: Stripe.Checkout.Session
): StripeCheckoutEntitlement | null {
  const email = session.customer_details?.email ?? session.customer_email;

  if (!email) {
    return null;
  }

  return {
    email: email.toLowerCase(),
    customerId: typeof session.customer === "string" ? session.customer : undefined,
    checkoutSessionId: session.id
  };
}
