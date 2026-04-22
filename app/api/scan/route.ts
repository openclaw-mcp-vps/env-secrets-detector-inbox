import { createHash, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  appendScanError,
  createScanJob,
  ensureUser,
  getLatestScanForUser,
  getScanJob,
  getUserById,
  patchScanJob,
  replaceScanFindings,
  saveUserGmailTokens
} from "@/lib/database";
import { getAuthorizedUserIdFromCookieStore, getSessionIdFromRequest } from "@/lib/auth";
import { buildScanSummary, maskSecret, scanTextForSecrets } from "@/lib/scanner";
import { createGmailApi, fetchScannableMessage, listMessageIds } from "@/lib/gmail";
import type { SecretFinding } from "@/lib/types";

export const runtime = "nodejs";

const runningJobs = new Map<string, Promise<void>>();
const MAX_STORED_FINDINGS = 5000;

const scanRequestSchema = z.object({
  query: z.string().trim().max(250).optional(),
  maxMessages: z.number().int().min(1).max(5000).optional()
});

function defaultMaxMessages(): number {
  const configured = Number(process.env.SCAN_MAX_MESSAGES ?? 1000);
  if (!Number.isFinite(configured)) return 1000;
  return Math.max(1, Math.min(5000, configured));
}

function toFingerprint(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 24);
}

function summarizeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unexpected scan error.";
}

async function runScanJob(
  scanId: string,
  userId: string,
  origin: string,
  query: string,
  maxMessages: number
): Promise<void> {
  await patchScanJob(scanId, userId, {
    status: "running",
    startedAt: new Date().toISOString(),
    processedMessages: 0,
    attachmentsScanned: 0
  });

  const user = await getUserById(userId);
  if (!user?.gmailTokens) {
    await patchScanJob(scanId, userId, {
      status: "failed",
      finishedAt: new Date().toISOString(),
      errors: ["Gmail account is not connected."]
    });
    return;
  }

  try {
    const { gmail } = await createGmailApi(origin, user.gmailTokens, async (tokens) => {
      await saveUserGmailTokens(userId, tokens);
    });

    const messageIds = await listMessageIds(gmail, query, maxMessages);
    const findings: SecretFinding[] = [];
    let messagesScanned = 0;
    let attachmentsScanned = 0;

    await patchScanJob(scanId, userId, {
      totalMessagesEstimate: messageIds.length
    });

    for (const messageId of messageIds) {
      try {
        const message = await fetchScannableMessage(gmail, messageId);
        messagesScanned += 1;

        const bodyMatches = scanTextForSecrets(message.bodyText);
        for (const match of bodyMatches) {
          if (findings.length >= MAX_STORED_FINDINGS) break;
          findings.push({
            id: randomUUID(),
            patternId: match.patternId,
            patternName: match.patternName,
            severity: match.severity,
            description: match.description,
            fingerprint: toFingerprint(match.value),
            preview: maskSecret(match.value),
            context: match.context,
            source: "body",
            messageId: message.id,
            threadId: message.threadId,
            subject: message.subject,
            from: message.from,
            internalDate: message.internalDate,
            snippet: message.snippet,
            createdAt: new Date().toISOString()
          });
        }

        for (const attachment of message.attachments) {
          attachmentsScanned += 1;
          const attachmentMatches = scanTextForSecrets(attachment.textContent);

          for (const match of attachmentMatches) {
            if (findings.length >= MAX_STORED_FINDINGS) break;
            findings.push({
              id: randomUUID(),
              patternId: match.patternId,
              patternName: match.patternName,
              severity: match.severity,
              description: match.description,
              fingerprint: toFingerprint(match.value),
              preview: maskSecret(match.value),
              context: match.context,
              source: "attachment",
              attachmentName: attachment.filename,
              messageId: message.id,
              threadId: message.threadId,
              subject: message.subject,
              from: message.from,
              internalDate: message.internalDate,
              snippet: message.snippet,
              createdAt: new Date().toISOString()
            });
          }
        }

        if (messagesScanned % 5 === 0) {
          await patchScanJob(scanId, userId, {
            processedMessages: messagesScanned,
            attachmentsScanned
          });
        }
      } catch (error) {
        await appendScanError(scanId, userId, `Message ${messageId}: ${summarizeError(error)}`);
      }
    }

    const summary = buildScanSummary(findings, messagesScanned, attachmentsScanned);

    await replaceScanFindings(scanId, userId, findings, summary, messagesScanned, attachmentsScanned);
    await patchScanJob(scanId, userId, {
      status: "completed",
      finishedAt: new Date().toISOString()
    });
  } catch (error) {
    await appendScanError(scanId, userId, summarizeError(error));
    await patchScanJob(scanId, userId, {
      status: "failed",
      finishedAt: new Date().toISOString()
    });
  }
}

function resolveUserId(request: NextRequest): string | null {
  const accessUserId = getAuthorizedUserIdFromCookieStore((name) => request.cookies.get(name));
  if (accessUserId) return accessUserId;

  return getSessionIdFromRequest(request);
}

export async function POST(request: NextRequest) {
  const userId = resolveUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const paidUser = getAuthorizedUserIdFromCookieStore((name) => request.cookies.get(name));
  if (!paidUser) {
    return NextResponse.json({ error: "Paywall access required." }, { status: 403 });
  }

  await ensureUser(userId);

  const parsed = scanRequestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid payload." }, { status: 400 });
  }

  const user = await getUserById(userId);
  if (!user?.gmailTokens) {
    return NextResponse.json({ error: "Connect Gmail first." }, { status: 400 });
  }

  const query = parsed.data.query || "in:anywhere";
  const maxMessages = parsed.data.maxMessages ?? defaultMaxMessages();

  const scan = await createScanJob(userId, query, maxMessages);
  const runPromise = runScanJob(scan.id, userId, request.nextUrl.origin, query, maxMessages).finally(() => {
    runningJobs.delete(scan.id);
  });

  runningJobs.set(scan.id, runPromise);

  return NextResponse.json(
    {
      scanId: scan.id,
      status: scan.status,
      query,
      maxMessages
    },
    { status: 202 }
  );
}

export async function GET(request: NextRequest) {
  const userId = resolveUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const paidUser = getAuthorizedUserIdFromCookieStore((name) => request.cookies.get(name));
  if (!paidUser) {
    return NextResponse.json({ error: "Paywall access required." }, { status: 403 });
  }

  const scanId = request.nextUrl.searchParams.get("scanId");
  const latest = request.nextUrl.searchParams.get("latest") === "1";

  if (latest) {
    const scan = await getLatestScanForUser(userId);
    return NextResponse.json({ scan });
  }

  if (!scanId) {
    return NextResponse.json({ error: "scanId query param is required." }, { status: 400 });
  }

  const scan = await getScanJob(scanId, userId);
  if (!scan) {
    return NextResponse.json({ error: "Scan not found." }, { status: 404 });
  }

  return NextResponse.json({ scan });
}
