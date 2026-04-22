import { NextRequest, NextResponse } from "next/server";
import { clearUserGmailTokens, ensureUser, saveUserGmailTokens } from "@/lib/database";
import {
  createOAuthState,
  getAuthorizedUserIdFromCookieStore,
  parseOAuthState,
  setSessionCookie
} from "@/lib/auth";
import { exchangeCodeForGmailTokens, gmailAuthUrl } from "@/lib/gmail";

export const runtime = "nodejs";

function redirectWithError(request: NextRequest, message: string) {
  const url = new URL("/dashboard", request.url);
  url.searchParams.set("gmail", "error");
  url.searchParams.set("message", message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const authorizedUserId = getAuthorizedUserIdFromCookieStore((name) => request.cookies.get(name));

  if (!authorizedUserId) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("unlock", "required");
    return NextResponse.redirect(loginUrl);
  }

  await ensureUser(authorizedUserId);

  const params = request.nextUrl.searchParams;
  const error = params.get("error");
  const code = params.get("code");

  if (error) {
    return redirectWithError(request, error);
  }

  if (!code) {
    const state = createOAuthState(authorizedUserId);
    const authUrl = gmailAuthUrl(request.nextUrl.origin, state);
    const response = NextResponse.redirect(authUrl);
    setSessionCookie(response, authorizedUserId);
    return response;
  }

  const state = params.get("state");
  const parsed = parseOAuthState(state);

  if (!parsed || parsed.userId !== authorizedUserId) {
    return redirectWithError(request, "invalid_oauth_state");
  }

  try {
    const tokens = await exchangeCodeForGmailTokens(request.nextUrl.origin, code);
    await saveUserGmailTokens(authorizedUserId, tokens);

    const redirectUrl = new URL("/dashboard", request.url);
    redirectUrl.searchParams.set("gmail", "connected");

    const response = NextResponse.redirect(redirectUrl);
    setSessionCookie(response, authorizedUserId);
    return response;
  } catch {
    return redirectWithError(request, "token_exchange_failed");
  }
}

export async function DELETE(request: NextRequest) {
  const authorizedUserId = getAuthorizedUserIdFromCookieStore((name) => request.cookies.get(name));

  if (!authorizedUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await clearUserGmailTokens(authorizedUserId);
  return NextResponse.json({ ok: true });
}
