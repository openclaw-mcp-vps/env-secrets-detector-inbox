import { NextRequest, NextResponse } from "next/server";
import { buildCheckoutUrl } from "@/lib/lemonsqueezy";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const mailbox = request.nextUrl.searchParams.get("mailbox") ?? "";
    const checkoutUrl = buildCheckoutUrl(mailbox);
    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Checkout configuration missing."
      },
      { status: 500 }
    );
  }
}
