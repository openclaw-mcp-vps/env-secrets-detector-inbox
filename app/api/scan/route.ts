import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { GMAIL_MAILBOX_COOKIE, PAYWALL_COOKIE } from "@/lib/constants";
import { getGmailConnection, isMailboxPaid, saveScanSummary } from "@/lib/database";
import { fetchProcessedMessage, getGmailClient, listMessageIds } from "@/lib/gmail";
import {
  buildSeverityBreakdown,
  buildTopSecretTypes,
  computeRiskScore,
  detectSecretsInText
} from "@/lib/secrets-detector";
import type { ScanApiResponse, ScanEmailResult } from "@/lib/types";

const requestSchema = z.object({
  maxEmails: z.coerce.number().int().min(10).max(500).default(120)
});

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const paidCookie = request.cookies.get(PAYWALL_COOKIE)?.value === "1";
  const mailbox = request.cookies.get(GMAIL_MAILBOX_COOKIE)?.value;

  if (!mailbox) {
    return NextResponse.json({ message: "Connect Gmail before scanning." }, { status: 401 });
  }

  if (!paidCookie || !(await isMailboxPaid(mailbox))) {
    return NextResponse.json({ message: "A paid mailbox subscription is required for scanning." }, { status: 402 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid scan request payload." }, { status: 400 });
  }

  const connection = await getGmailConnection(mailbox);
  if (!connection) {
    return NextResponse.json({ message: "No Gmail OAuth tokens found. Reconnect your mailbox." }, { status: 401 });
  }

  try {
    const gmail = getGmailClient(connection.tokens);
    const messageIds = await listMessageIds(gmail, parsed.data.maxEmails);

    const results: ScanEmailResult[] = [];
    const allFindings: ScanEmailResult["findings"] = [];

    const queue = [...messageIds];
    const workerCount = Math.min(5, queue.length || 1);

    await Promise.all(
      Array.from({ length: workerCount }).map(async () => {
        while (queue.length > 0) {
          const messageId = queue.shift();
          if (!messageId) {
            return;
          }

          try {
            const message = await fetchProcessedMessage(gmail, messageId);

            const findings = [
              ...detectSecretsInText({
                text: message.bodyText,
                source: `email-body:${message.subject}`
              })
            ];

            for (const attachment of message.attachments) {
              findings.push(
                ...detectSecretsInText({
                  text: attachment.extractedText,
                  source: `attachment:${attachment.filename}`
                })
              );
            }

            if (findings.length > 0) {
              const payload: ScanEmailResult = {
                messageId: message.id,
                threadId: message.threadId,
                subject: message.subject,
                from: message.from,
                date: message.date,
                snippet: message.snippet,
                findings,
                attachmentCount: message.attachments.length
              };

              results.push(payload);
              allFindings.push(...findings);
            }
          } catch {
            continue;
          }
        }
      })
    );

    results.sort((a, b) => b.findings.length - a.findings.length);

    const severity = buildSeverityBreakdown(allFindings);
    const topTypes = buildTopSecretTypes(allFindings);

    const summary: ScanApiResponse = {
      scanId: randomUUID(),
      mailbox: mailbox.toLowerCase(),
      scannedAt: new Date().toISOString(),
      totalMessagesScanned: messageIds.length,
      flaggedMessages: results.length,
      totalFindings: allFindings.length,
      severity,
      riskScore: computeRiskScore(allFindings),
      topTypes,
      results
    };

    await saveScanSummary({
      scanId: summary.scanId,
      mailbox: summary.mailbox,
      scannedAt: summary.scannedAt,
      totalMessagesScanned: summary.totalMessagesScanned,
      flaggedMessages: summary.flaggedMessages,
      totalFindings: summary.totalFindings,
      severity: summary.severity,
      riskScore: summary.riskScore,
      topTypes: summary.topTypes
    });

    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Scan failed due to an unexpected error."
      },
      { status: 500 }
    );
  }
}
