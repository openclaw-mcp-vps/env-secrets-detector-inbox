import path from "node:path";
import { google, gmail_v1 } from "googleapis";
import type { Credentials, OAuth2Client } from "google-auth-library";

const GMAIL_READONLY_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

export interface GmailAttachment {
  filename: string;
  mimeType: string;
  size: number;
  extractedText: string;
}

export interface ProcessedGmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  bodyText: string;
  attachments: GmailAttachment[];
}

interface LooseCredentials {
  access_token?: string | null;
  refresh_token?: string | null;
  scope?: string | null;
  token_type?: string | null;
  expiry_date?: number | null;
}

function decodeBase64Url(data?: string | null): Buffer {
  if (!data) {
    return Buffer.alloc(0);
  }

  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64");
}

function stripHtmlTags(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function getHeader(message: gmail_v1.Schema$Message, name: string): string {
  const headers = message.payload?.headers ?? [];
  const value = headers.find((header) => header.name?.toLowerCase() === name.toLowerCase())?.value;
  return value ?? "";
}

function flattenParts(part?: gmail_v1.Schema$MessagePart): gmail_v1.Schema$MessagePart[] {
  if (!part) {
    return [];
  }

  const items: gmail_v1.Schema$MessagePart[] = [part];
  for (const child of part.parts ?? []) {
    items.push(...flattenParts(child));
  }
  return items;
}

function isLikelyTextAttachment(filename: string, mimeType: string): boolean {
  const textMimes = [
    "text/",
    "application/json",
    "application/xml",
    "application/x-yaml",
    "application/yaml",
    "application/javascript",
    "application/x-sh",
    "application/sql"
  ];

  if (textMimes.some((entry) => mimeType.startsWith(entry))) {
    return true;
  }

  const ext = path.extname(filename.toLowerCase());
  return [
    ".txt",
    ".md",
    ".env",
    ".json",
    ".yaml",
    ".yml",
    ".xml",
    ".csv",
    ".ini",
    ".conf",
    ".log",
    ".properties",
    ".toml",
    ".js",
    ".ts",
    ".tsx",
    ".jsx",
    ".py",
    ".rb",
    ".go",
    ".java",
    ".php",
    ".sql",
    ".sh"
  ].includes(ext);
}

function extractPrintableSequences(binary: Buffer): string {
  const text = binary.toString("latin1");
  const printable = text.match(/[\x20-\x7E]{14,}/g) ?? [];
  return printable.slice(0, 120).join("\n");
}

function extractTextFromAttachment(binary: Buffer, filename: string, mimeType: string): string {
  if (isLikelyTextAttachment(filename, mimeType)) {
    return binary.toString("utf8");
  }

  return extractPrintableSequences(binary);
}

export function getOAuthClient(origin: string): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI ?? `${origin}/api/auth/gmail`;

  if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in environment.");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getGmailAuthUrl(origin: string, state: string): string {
  const oauth2Client = getOAuthClient(origin);

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: true,
    scope: [GMAIL_READONLY_SCOPE],
    state
  });
}

export async function exchangeCodeForGmailTokens(
  origin: string,
  code: string
): Promise<{ mailbox: string; tokens: Credentials }> {
  const oauth2Client = getOAuthClient(origin);
  const { tokens } = await oauth2Client.getToken(code);

  oauth2Client.setCredentials(tokens);
  const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
  const profile = await oauth2.userinfo.get();
  const mailbox = profile.data.email;

  if (!mailbox) {
    throw new Error("Unable to resolve Gmail mailbox from OAuth profile.");
  }

  return {
    mailbox: mailbox.toLowerCase(),
    tokens
  };
}

function sanitizeCredentials(tokens: LooseCredentials): Credentials {
  const credentials: Credentials = {};

  if (tokens.access_token) {
    credentials.access_token = tokens.access_token;
  }
  if (tokens.refresh_token) {
    credentials.refresh_token = tokens.refresh_token;
  }
  if (tokens.scope) {
    credentials.scope = tokens.scope;
  }
  if (tokens.token_type) {
    credentials.token_type = tokens.token_type;
  }
  if (typeof tokens.expiry_date === "number") {
    credentials.expiry_date = tokens.expiry_date;
  }

  return credentials;
}

export function getGmailClient(tokens: LooseCredentials): gmail_v1.Gmail {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;

  if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in environment.");
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oauth2Client.setCredentials(sanitizeCredentials(tokens));

  return google.gmail({ version: "v1", auth: oauth2Client });
}

export async function listMessageIds(gmail: gmail_v1.Gmail, limit: number): Promise<string[]> {
  const messageIds: string[] = [];
  let nextPageToken: string | undefined;

  while (messageIds.length < limit) {
    const pageSize = Math.min(100, limit - messageIds.length);
    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults: pageSize,
      includeSpamTrash: false,
      pageToken: nextPageToken
    });

    const batchIds = (response.data.messages ?? []).map((message) => message.id).filter(Boolean) as string[];
    messageIds.push(...batchIds);

    if (!response.data.nextPageToken || batchIds.length === 0) {
      break;
    }

    nextPageToken = response.data.nextPageToken;
  }

  return messageIds.slice(0, limit);
}

export async function fetchProcessedMessage(
  gmail: gmail_v1.Gmail,
  messageId: string
): Promise<ProcessedGmailMessage> {
  const response = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full"
  });

  const message = response.data;
  const parts = flattenParts(message.payload);
  const bodySegments: string[] = [];

  for (const part of parts) {
    const mimeType = part.mimeType ?? "";
    if (!part.body?.data) {
      continue;
    }

    const decoded = decodeBase64Url(part.body.data).toString("utf8");
    if (!decoded.trim()) {
      continue;
    }

    if (mimeType.includes("text/plain")) {
      bodySegments.push(decoded);
    } else if (mimeType.includes("text/html")) {
      bodySegments.push(stripHtmlTags(decoded));
    }
  }

  if (bodySegments.length === 0 && message.payload?.body?.data) {
    bodySegments.push(decodeBase64Url(message.payload.body.data).toString("utf8"));
  }

  const attachments: GmailAttachment[] = [];

  for (const part of parts) {
    const filename = part.filename ?? "";
    const attachmentId = part.body?.attachmentId;
    const inlineData = part.body?.data;

    if (!filename && !attachmentId) {
      continue;
    }

    const mimeType = part.mimeType ?? "application/octet-stream";
    let binary = Buffer.alloc(0);

    if (attachmentId) {
      const attachmentResponse = await gmail.users.messages.attachments.get({
        userId: "me",
        messageId,
        id: attachmentId
      });
      binary = Buffer.from(decodeBase64Url(attachmentResponse.data.data));
    } else if (inlineData) {
      binary = Buffer.from(decodeBase64Url(inlineData));
    }

    if (!binary.length) {
      continue;
    }

    const extracted = extractTextFromAttachment(binary, filename || "attachment.bin", mimeType).slice(0, 60000);
    attachments.push({
      filename: filename || "attachment.bin",
      mimeType,
      size: binary.length,
      extractedText: extracted
    });
  }

  return {
    id: message.id ?? messageId,
    threadId: message.threadId ?? "",
    subject: getHeader(message, "Subject") || "(No subject)",
    from: getHeader(message, "From") || "Unknown sender",
    date: getHeader(message, "Date") || "",
    snippet: message.snippet ?? "",
    bodyText: bodySegments.join("\n\n").trim(),
    attachments
  };
}
