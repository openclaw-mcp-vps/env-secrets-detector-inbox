import "server-only";

import { google, gmail_v1 } from "googleapis";
import type { Credentials } from "google-auth-library";
import type { ScannableAttachment, ScannableMessage, StoredGmailTokens } from "@/lib/types";

const GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

function getRedirectUri(origin: string): string {
  return process.env.GOOGLE_REDIRECT_URI || `${origin}/api/auth/gmail`;
}

function getOAuthClient(origin: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.");
  }

  return new google.auth.OAuth2(clientId, clientSecret, getRedirectUri(origin));
}

function decodeBase64Url(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf8");
}

function flattenParts(part?: gmail_v1.Schema$MessagePart): gmail_v1.Schema$MessagePart[] {
  if (!part) return [];
  if (!part.parts || part.parts.length === 0) return [part];

  const flattened: gmail_v1.Schema$MessagePart[] = [];
  for (const child of part.parts) {
    flattened.push(...flattenParts(child));
  }
  return flattened;
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function textFromPayload(payload?: gmail_v1.Schema$MessagePart): string {
  if (!payload) return "";

  const parts = flattenParts(payload);
  const plain = parts
    .filter((part) => part.mimeType === "text/plain" && part.body?.data)
    .map((part) => decodeBase64Url(part.body?.data || ""))
    .join("\n");

  if (plain.trim()) return plain;

  const html = parts
    .filter((part) => part.mimeType === "text/html" && part.body?.data)
    .map((part) => decodeBase64Url(part.body?.data || ""))
    .join("\n");

  if (html.trim()) {
    return htmlToText(html);
  }

  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  return "";
}

function headerValue(payload: gmail_v1.Schema$MessagePart | undefined, name: string): string {
  if (!payload?.headers) return "";
  const found = payload.headers.find((header) => header.name?.toLowerCase() === name.toLowerCase());
  return found?.value?.trim() ?? "";
}

interface AttachmentDescriptor {
  filename: string;
  mimeType: string;
  attachmentId?: string;
  inlineData?: string;
}

function attachmentDescriptors(payload?: gmail_v1.Schema$MessagePart): AttachmentDescriptor[] {
  if (!payload) return [];

  const descriptors: AttachmentDescriptor[] = [];
  const parts = flattenParts(payload);

  for (const part of parts) {
    if (!part.filename) {
      continue;
    }

    descriptors.push({
      filename: part.filename,
      mimeType: part.mimeType || "application/octet-stream",
      attachmentId: part.body?.attachmentId || undefined,
      inlineData: part.body?.data || undefined
    });
  }

  return descriptors;
}

async function textFromAttachment(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  const lower = filename.toLowerCase();

  if (mimeType.includes("pdf") || lower.endsWith(".pdf")) {
    const pdfParseModule = await import("pdf-parse");
    const parsed = await pdfParseModule.default(buffer);
    return parsed.text || "";
  }

  if (
    mimeType.includes("wordprocessingml") ||
    mimeType.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document") ||
    lower.endsWith(".docx")
  ) {
    const mammoth = await import("mammoth");
    const parsed = await mammoth.extractRawText({ buffer });
    return parsed.value || "";
  }

  const textTypes = [
    "text/",
    "application/json",
    "application/xml",
    "application/javascript",
    "application/x-sh",
    "application/x-yaml"
  ];

  if (
    textTypes.some((prefix) => mimeType.startsWith(prefix)) ||
    [".txt", ".md", ".csv", ".json", ".yaml", ".yml", ".env", ".ini", ".log", ".xml"].some((ext) =>
      lower.endsWith(ext)
    )
  ) {
    return buffer.toString("utf8");
  }

  // Fallback: scan printable text fragments in unknown binary formats.
  const fallback = buffer
    .toString("utf8")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (fallback.length >= 80) {
    return fallback;
  }

  return "";
}

async function resolveAttachments(
  gmail: gmail_v1.Gmail,
  messageId: string,
  payload?: gmail_v1.Schema$MessagePart
): Promise<ScannableAttachment[]> {
  const descriptors = attachmentDescriptors(payload);
  const results: ScannableAttachment[] = [];

  for (const descriptor of descriptors) {
    try {
      const rawData = descriptor.inlineData
        ? descriptor.inlineData
        : descriptor.attachmentId
          ? (
              await gmail.users.messages.attachments.get({
                userId: "me",
                messageId,
                id: descriptor.attachmentId
              })
            ).data.data || ""
          : "";

      if (!rawData) continue;

      const binary = Buffer.from(rawData.replace(/-/g, "+").replace(/_/g, "/"), "base64");
      if (binary.byteLength > 10 * 1024 * 1024) {
        continue;
      }

      const text = await textFromAttachment(binary, descriptor.filename, descriptor.mimeType);
      if (!text.trim()) continue;

      results.push({
        filename: descriptor.filename,
        mimeType: descriptor.mimeType,
        textContent: text
      });
    } catch {
      continue;
    }
  }

  return results;
}

export function gmailAuthUrl(origin: string, state: string): string {
  const oauth2 = getOAuthClient(origin);
  return oauth2.generateAuthUrl({
    access_type: "offline",
    scope: GMAIL_SCOPES,
    prompt: "consent",
    state,
    include_granted_scopes: true
  });
}

export async function exchangeCodeForGmailTokens(origin: string, code: string): Promise<StoredGmailTokens> {
  const oauth2 = getOAuthClient(origin);
  const { tokens } = await oauth2.getToken(code);

  return {
    access_token: tokens.access_token ?? null,
    refresh_token: tokens.refresh_token ?? null,
    scope: tokens.scope ?? null,
    token_type: tokens.token_type ?? null,
    expiry_date: tokens.expiry_date ?? null,
    id_token: tokens.id_token ?? null
  };
}

export async function createGmailApi(
  origin: string,
  tokens: StoredGmailTokens,
  onTokens?: (tokens: StoredGmailTokens) => Promise<void>
): Promise<{ gmail: gmail_v1.Gmail; oauth2: InstanceType<typeof google.auth.OAuth2> }> {
  const oauth2 = getOAuthClient(origin);

  oauth2.setCredentials(tokens as Credentials);

  if (onTokens) {
    oauth2.on("tokens", (nextTokens) => {
      const normalized: StoredGmailTokens = {
        access_token: nextTokens.access_token ?? null,
        refresh_token: nextTokens.refresh_token ?? tokens.refresh_token ?? null,
        scope: nextTokens.scope ?? tokens.scope ?? null,
        token_type: nextTokens.token_type ?? tokens.token_type ?? null,
        expiry_date: nextTokens.expiry_date ?? tokens.expiry_date ?? null,
        id_token: nextTokens.id_token ?? tokens.id_token ?? null
      };
      void onTokens(normalized);
    });
  }

  const gmail = google.gmail({
    version: "v1",
    auth: oauth2
  });

  return { gmail, oauth2 };
}

export async function listMessageIds(
  gmail: gmail_v1.Gmail,
  query: string,
  maxMessages: number
): Promise<string[]> {
  const ids: string[] = [];
  let pageToken: string | undefined;

  while (ids.length < maxMessages) {
    const response = await gmail.users.messages.list({
      userId: "me",
      q: query || undefined,
      maxResults: 100,
      pageToken
    });

    const messages = response.data.messages ?? [];
    for (const message of messages) {
      if (message.id) ids.push(message.id);
      if (ids.length >= maxMessages) break;
    }

    pageToken = response.data.nextPageToken ?? undefined;
    if (!pageToken || messages.length === 0) break;
  }

  return ids;
}

export async function fetchScannableMessage(gmail: gmail_v1.Gmail, messageId: string): Promise<ScannableMessage> {
  const response = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full"
  });

  const message = response.data;
  const payload = message.payload;

  const subject = headerValue(payload, "subject") || "(no subject)";
  const from = headerValue(payload, "from") || "Unknown sender";
  const internalDate = message.internalDate
    ? new Date(Number(message.internalDate)).toISOString()
    : new Date().toISOString();

  const bodyText = textFromPayload(payload);
  const attachments = await resolveAttachments(gmail, messageId, payload);

  return {
    id: message.id || messageId,
    threadId: message.threadId || messageId,
    subject,
    from,
    internalDate,
    snippet: message.snippet || "",
    bodyText,
    attachments
  };
}
