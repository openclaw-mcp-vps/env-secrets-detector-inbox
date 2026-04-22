import { NextRequest, NextResponse } from "next/server";
import {
  hasProcessedWebhookEvent,
  markWebhookEventProcessed,
  upsertEntitlement
} from "@/lib/database";
import { entitlementFromCheckoutSession, verifyStripeWebhookEvent } from "@/lib/lemonsqueezy";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  const rawBody = await request.text();

  try {
    const event = verifyStripeWebhookEvent(rawBody, signature);

    if (await hasProcessedWebhookEvent(event.id)) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      if (session.payment_status === "paid" || session.status === "complete") {
        const entitlement = entitlementFromCheckoutSession(session);
        if (entitlement) {
          await upsertEntitlement(entitlement.email, {
            active: true,
            source: "stripe-webhook",
            stripeCustomerId: entitlement.customerId,
            checkoutSessionId: entitlement.checkoutSessionId
          });
        }
      }
    }

    await markWebhookEventProcessed({
      eventId: event.id,
      type: event.type,
      receivedAt: new Date().toISOString()
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown webhook verification error.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
