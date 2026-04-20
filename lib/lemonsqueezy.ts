import crypto from "node:crypto";

export interface LemonSqueezyWebhookPayload {
  meta?: {
    event_name?: string;
    custom_data?: Record<string, unknown>;
  };
  data?: {
    id?: string | number;
    attributes?: {
      user_email?: string;
      customer_id?: string | number;
      status?: string;
      renews_at?: string;
      ends_at?: string;
      custom_data?: Record<string, unknown>;
    };
  };
}

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!secret || !signature) {
    return false;
  }

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const incomingBuffer = Buffer.from(signature, "utf8");

  if (expectedBuffer.length !== incomingBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, incomingBuffer);
}

function getCheckoutBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL;
  if (explicit && explicit.startsWith("http")) {
    return explicit;
  }

  const productId = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID;
  if (!productId) {
    throw new Error("NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID is missing.");
  }

  if (productId.startsWith("http")) {
    return productId;
  }

  return `https://checkout.lemonsqueezy.com/buy/${productId}`;
}

export function buildCheckoutUrl(mailbox?: string): string {
  const base = getCheckoutBaseUrl();
  const checkoutUrl = new URL(base);

  if (mailbox) {
    checkoutUrl.searchParams.set("checkout[email]", mailbox);
    checkoutUrl.searchParams.set("checkout[custom][mailbox]", mailbox);
  }

  checkoutUrl.searchParams.set("checkout[custom][tool]", "inbox-secrets-detector");
  checkoutUrl.searchParams.set("checkout[custom][plan]", "mailbox-monthly-19");

  return checkoutUrl.toString();
}

export function extractPaidMailbox(payload: LemonSqueezyWebhookPayload): {
  mailbox: string | null;
  orderId: string | undefined;
  customerId: string | undefined;
  eventName: string;
  validUntil: string | undefined;
} {
  const eventName = payload.meta?.event_name ?? "unknown";
  const customMailbox = payload.meta?.custom_data?.mailbox;
  const attrMailbox = payload.data?.attributes?.custom_data?.mailbox;
  const emailMailbox = payload.data?.attributes?.user_email;
  const mailboxCandidate = customMailbox ?? attrMailbox ?? emailMailbox;

  const mailbox = typeof mailboxCandidate === "string" && mailboxCandidate.includes("@")
    ? mailboxCandidate.toLowerCase().trim()
    : null;

  const orderId = payload.data?.id ? String(payload.data.id) : undefined;
  const customerId = payload.data?.attributes?.customer_id
    ? String(payload.data.attributes.customer_id)
    : undefined;

  const validUntil =
    payload.data?.attributes?.renews_at ?? payload.data?.attributes?.ends_at ?? undefined;

  return {
    mailbox,
    orderId,
    customerId,
    eventName,
    validUntil
  };
}

export function isPaymentEvent(eventName: string): boolean {
  const accepted = new Set([
    "order_created",
    "order_refunded",
    "subscription_created",
    "subscription_updated",
    "subscription_cancelled",
    "subscription_expired",
    "subscription_resumed",
    "subscription_unpaused"
  ]);

  return accepted.has(eventName);
}

export function isRevocationEvent(eventName: string): boolean {
  return eventName === "order_refunded" || eventName === "subscription_expired";
}
