import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { GMAIL_MAILBOX_COOKIE, PAYWALL_COOKIE, PAYWALL_MAILBOX_COOKIE } from "@/lib/constants";
import { getPaidMailbox, isMailboxPaid } from "@/lib/database";

const payloadSchema = z.object({
  email: z.string().email()
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => ({}));
  const parsed = payloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "A valid mailbox email is required." }, { status: 400 });
  }

  const mailbox = parsed.data.email.toLowerCase().trim();
  const paidRecord = await getPaidMailbox(mailbox);

  if (!paidRecord || !(await isMailboxPaid(mailbox))) {
    return NextResponse.json(
      {
        success: false,
        message: "No active payment found for this mailbox yet. Complete checkout first."
      },
      { status: 404 }
    );
  }

  const response = NextResponse.json({
    success: true,
    message: "Mailbox unlocked successfully."
  });

  const secure = process.env.NODE_ENV === "production";
  const maxAge = 60 * 60 * 24 * 31;

  response.cookies.set(PAYWALL_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge
  });

  response.cookies.set(PAYWALL_MAILBOX_COOKIE, mailbox, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge
  });

  response.cookies.set(GMAIL_MAILBOX_COOKIE, mailbox, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge
  });

  return response;
}
