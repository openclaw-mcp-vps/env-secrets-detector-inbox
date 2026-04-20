import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { GMAIL_MAILBOX_COOKIE, GMAIL_OAUTH_STATE_COOKIE } from "@/lib/constants";
import { upsertGmailConnection } from "@/lib/database";
import { exchangeCodeForGmailTokens, getGmailAuthUrl } from "@/lib/gmail";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oauthError = request.nextUrl.searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(new URL(`/dashboard?gmail_error=${encodeURIComponent(oauthError)}`, request.url));
  }

  const secure = process.env.NODE_ENV === "production";

  if (!code) {
    const nonce = randomUUID();
    const authUrl = getGmailAuthUrl(request.nextUrl.origin, nonce);
    const response = NextResponse.redirect(authUrl);

    response.cookies.set(GMAIL_OAUTH_STATE_COOKIE, nonce, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10
    });

    return response;
  }

  const expectedState = request.cookies.get(GMAIL_OAUTH_STATE_COOKIE)?.value;

  if (!state || !expectedState || expectedState !== state) {
    return NextResponse.redirect(new URL("/dashboard?gmail_error=invalid_state", request.url));
  }

  try {
    const { mailbox, tokens } = await exchangeCodeForGmailTokens(request.nextUrl.origin, code);
    await upsertGmailConnection(mailbox, tokens);

    const response = NextResponse.redirect(new URL("/dashboard?gmail=connected", request.url));

    response.cookies.set(GMAIL_OAUTH_STATE_COOKIE, "", {
      path: "/",
      maxAge: 0
    });

    response.cookies.set(GMAIL_MAILBOX_COOKIE, mailbox, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 90
    });

    return response;
  } catch {
    return NextResponse.redirect(new URL("/dashboard?gmail_error=oauth_exchange_failed", request.url));
  }
}
