import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "isd_session";
const ACCESS_COOKIE = "isd_access";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
const ACCESS_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

interface SignedPayload<T> {
  v: T;
  exp: number;
}

function appSecret(): string {
  return process.env.APP_SECRET || "change-this-app-secret-for-production";
}

function sign(value: string): string {
  return createHmac("sha256", appSecret()).update(value).digest("base64url");
}

function encodePayload<T>(payload: SignedPayload<T>): string {
  const json = JSON.stringify(payload);
  const base = Buffer.from(json, "utf8").toString("base64url");
  return `${base}.${sign(base)}`;
}

function decodePayload<T>(token: string | undefined): SignedPayload<T> | null {
  if (!token) return null;

  const [base, signature] = token.split(".");
  if (!base || !signature) return null;

  const expected = sign(base);
  const expectedBuf = Buffer.from(expected);
  const receivedBuf = Buffer.from(signature);

  if (expectedBuf.length !== receivedBuf.length) return null;
  if (!timingSafeEqual(expectedBuf, receivedBuf)) return null;

  try {
    const payload = JSON.parse(Buffer.from(base, "base64url").toString("utf8")) as SignedPayload<T>;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getSessionIdFromRequest(request: NextRequest): string | null {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const payload = decodePayload<string>(token);
  return payload?.v ?? null;
}

export function getSessionIdFromCookieStore(getCookie: (name: string) => { value: string } | undefined): string | null {
  const token = getCookie(SESSION_COOKIE)?.value;
  const payload = decodePayload<string>(token);
  return payload?.v ?? null;
}

export function getAuthorizedUserIdFromCookieStore(
  getCookie: (name: string) => { value: string } | undefined
): string | null {
  const token = getCookie(ACCESS_COOKIE)?.value;
  const payload = decodePayload<string>(token);
  return payload?.v ?? null;
}

export function ensureSession(request: NextRequest, response: NextResponse): string {
  const existing = getSessionIdFromRequest(request);
  const sessionId = existing ?? randomUUID();

  const token = encodePayload({
    v: sessionId,
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000
  });

  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    maxAge: SESSION_MAX_AGE_SECONDS,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  });

  return sessionId;
}

export function setSessionCookie(response: NextResponse, sessionId: string): void {
  const token = encodePayload({
    v: sessionId,
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000
  });

  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    maxAge: SESSION_MAX_AGE_SECONDS,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  });
}

export function grantAccessCookie(response: NextResponse, userId: string): void {
  const token = encodePayload({
    v: userId,
    exp: Date.now() + ACCESS_MAX_AGE_SECONDS * 1000
  });

  response.cookies.set({
    name: ACCESS_COOKIE,
    value: token,
    maxAge: ACCESS_MAX_AGE_SECONDS,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  });
}

export function clearAccessCookie(response: NextResponse): void {
  response.cookies.set({
    name: ACCESS_COOKIE,
    value: "",
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  });
}

interface OAuthStatePayload {
  userId: string;
  nonce: string;
}

export function createOAuthState(userId: string): string {
  return encodePayload<OAuthStatePayload>({
    v: {
      userId,
      nonce: randomUUID()
    },
    exp: Date.now() + 1000 * 60 * 10
  });
}

export function parseOAuthState(state: string | null): OAuthStatePayload | null {
  if (!state) return null;
  const payload = decodePayload<OAuthStatePayload>(state);
  return payload?.v ?? null;
}
