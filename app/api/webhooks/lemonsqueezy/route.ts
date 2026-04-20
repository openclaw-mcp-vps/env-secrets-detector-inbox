import { NextRequest, NextResponse } from "next/server";
import { upsertPaidMailbox } from "@/lib/database";
import {
  extractPaidMailbox,
  isPaymentEvent,
  isRevocationEvent,
  type LemonSqueezyWebhookPayload,
  verifyWebhookSignature
} from "@/lib/lemonsqueezy";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ ok: false, message: "Invalid webhook signature." }, { status: 401 });
  }

  let payload: LemonSqueezyWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as LemonSqueezyWebhookPayload;
  } catch {
    return NextResponse.json({ ok: false, message: "Malformed webhook payload." }, { status: 400 });
  }

  const { mailbox, eventName, orderId, customerId, validUntil } = extractPaidMailbox(payload);

  if (!isPaymentEvent(eventName)) {
    return NextResponse.json({ ok: true, message: `Ignored event: ${eventName}` });
  }

  if (!mailbox) {
    return NextResponse.json({ ok: true, message: "No mailbox identifier in webhook custom data." });
  }

  const fallbackExpiry = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString();

  await upsertPaidMailbox({
    mailbox,
    orderId,
    customerId,
    sourceEvent: eventName,
    paidAt: new Date().toISOString(),
    validUntil: isRevocationEvent(eventName) ? new Date(0).toISOString() : validUntil ?? fallbackExpiry
  });

  return NextResponse.json({ ok: true });
}
