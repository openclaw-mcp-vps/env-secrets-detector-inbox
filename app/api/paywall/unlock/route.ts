import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  activateUserPaidAccess,
  ensureUser,
  getEntitlementByEmail,
  upsertEntitlement
} from "@/lib/database";
import {
  getSessionIdFromRequest,
  grantAccessCookie,
  setSessionCookie
} from "@/lib/auth";
import { entitlementFromCheckoutSession, getStripeClient } from "@/lib/lemonsqueezy";

export const runtime = "nodejs";

const unlockSchema = z
  .object({
    email: z.string().email().optional(),
    sessionId: z.string().min(8).max(255).optional()
  })
  .refine((value) => value.email || value.sessionId, {
    message: "Provide checkout email or Stripe session ID."
  });

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = unlockSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message || "Invalid request body."
      },
      { status: 400 }
    );
  }

  const userId = getSessionIdFromRequest(request) || randomUUID();
  await ensureUser(userId);

  let verifiedEmail = parsed.data.email?.trim().toLowerCase();

  if (parsed.data.sessionId) {
    const stripe = getStripeClient();

    if (!stripe) {
      return NextResponse.json(
        {
          error:
            "STRIPE_SECRET_KEY is missing. Add it to verify checkout sessions directly, or use webhook-confirmed email unlock."
        },
        { status: 500 }
      );
    }

    try {
      const session = await stripe.checkout.sessions.retrieve(parsed.data.sessionId);
      if (!(session.payment_status === "paid" || session.status === "complete")) {
        return NextResponse.json({ error: "Checkout session is not paid yet." }, { status: 403 });
      }

      const entitlement = entitlementFromCheckoutSession(session);
      if (!entitlement) {
        return NextResponse.json({ error: "Paid session is missing customer email." }, { status: 400 });
      }

      verifiedEmail = entitlement.email;
      await upsertEntitlement(entitlement.email, {
        active: true,
        source: "manual",
        checkoutSessionId: entitlement.checkoutSessionId,
        stripeCustomerId: entitlement.customerId
      });
    } catch {
      return NextResponse.json({ error: "Unable to verify Stripe checkout session." }, { status: 400 });
    }
  }

  if (!verifiedEmail) {
    return NextResponse.json(
      { error: "Could not determine a purchase email from request." },
      { status: 400 }
    );
  }

  const entitlement = await getEntitlementByEmail(verifiedEmail);
  if (!entitlement?.active) {
    return NextResponse.json(
      {
        error:
          "No active purchase found for that email yet. Complete checkout or wait for webhook confirmation."
      },
      { status: 403 }
    );
  }

  await activateUserPaidAccess(userId, verifiedEmail, parsed.data.sessionId ? "session-verify" : "manual");

  const response = NextResponse.json({ ok: true, email: verifiedEmail });
  setSessionCookie(response, userId);
  grantAccessCookie(response, userId);
  return response;
}
