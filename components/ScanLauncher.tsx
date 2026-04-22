"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
import { RedactionTool } from "@/components/RedactionTool";
import { ScanResults } from "@/components/ScanResults";
import { SecurityReport } from "@/components/SecurityReport";
import type { ScanJobRecord } from "@/lib/types";

interface ScanLauncherProps {
  initialScan: ScanJobRecord | null;
  gmailConnected: boolean;
}

type ScanResponse = {
  scanId: string;
  status: ScanJobRecord["status"];
};

export function ScanLauncher({ initialScan, gmailConnected }: ScanLauncherProps) {
  const [query, setQuery] = useState("in:anywhere");
  const [maxMessages, setMaxMessages] = useState(1000);
  const [scan, setScan] = useState<ScanJobRecord | null>(initialScan);
  const [statusText, setStatusText] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRunning = scan?.status === "queued" || scan?.status === "running";

  useEffect(() => {
    if (!scan || !(scan.status === "queued" || scan.status === "running")) {
      return;
    }

    const interval = setInterval(async () => {
      const response = await fetch(`/api/scan?scanId=${scan.id}`);
      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { scan?: ScanJobRecord };
      if (!payload.scan) return;

      setScan(payload.scan);
      if (payload.scan.status === "completed") {
        setStatusText("Scan completed.");
      }
      if (payload.scan.status === "failed") {
        setStatusText("Scan failed. Review the errors in job details.");
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [scan]);

  async function runScan() {
    setIsSubmitting(true);
    setStatusText("Starting scan job...");

    const response = await fetch("/api/scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query,
        maxMessages
      })
    });

    const payload = (await response.json().catch(() => ({}))) as
      | (ScanResponse & { error?: never })
      | { error?: string };

    if (!response.ok || !("scanId" in payload)) {
      setStatusText(payload.error || "Could not start scan.");
      setIsSubmitting(false);
      return;
    }

    setScan({
      id: payload.scanId,
      userId: "",
      status: payload.status,
      query,
      maxMessages,
      createdAt: new Date().toISOString(),
      processedMessages: 0,
      attachmentsScanned: 0,
      findings: [],
      summary: {
        totalFindings: 0,
        uniqueSecrets: 0,
        bySeverity: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0
        },
        byPattern: {},
        messagesScanned: 0,
        attachmentsScanned: 0,
        riskyMessages: 0
      },
      errors: []
    });

    setStatusText("Scan queued.");
    setIsSubmitting(false);
  }

  const findingsCount = useMemo(() => scan?.summary.totalFindings ?? 0, [scan]);

  if (!gmailConnected) {
    return (
      <section className="rounded-2xl border border-[#263144] bg-[#101722] p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-[#d29922]" />
          <div>
            <h3 className="font-[var(--font-space-grotesk)] text-lg font-semibold text-[#f0f6fc]">
              Gmail is not connected
            </h3>
            <p className="mt-1 text-sm text-[#8b949e]">
              Connect your mailbox with read-only OAuth before scanning email bodies and attachments.
            </p>
            <a
              href="/api/auth/gmail"
              className="mt-4 inline-flex items-center rounded-lg bg-[#1f6feb] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#388bfd]"
            >
              Connect Gmail
            </a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#263144] bg-[#101722] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-[var(--font-space-grotesk)] text-2xl font-semibold text-[#f0f6fc]">
              Inbox Scan Control
            </h2>
            <p className="mt-1 text-sm text-[#8b949e]">
              Scan email body + attachments for 50+ credential patterns with hashed evidence.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#30363d] bg-[#0d1117] px-3 py-1 text-xs text-[#8b949e]">
            <ShieldCheck className="h-4 w-4 text-[#3fb950]" />
            Findings stored without raw secret values
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_160px_160px]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#e6edf3] outline-none transition focus:border-[#58a6ff]"
            placeholder="Gmail query, e.g. in:anywhere has:attachment"
          />

          <input
            type="number"
            min={1}
            max={5000}
            value={maxMessages}
            onChange={(event) => setMaxMessages(Number(event.target.value))}
            className="rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#e6edf3] outline-none transition focus:border-[#58a6ff]"
          />

          <button
            type="button"
            onClick={runScan}
            disabled={isSubmitting || isRunning}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1f6feb] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#388bfd] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting || isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isRunning ? "Scanning..." : "Start scan"}
          </button>
        </div>

        {scan ? (
          <div className="mt-4 rounded-lg border border-[#30363d] bg-[#0d1117] p-3 text-sm text-[#8b949e]">
            <p>
              Job status: <span className="text-[#f0f6fc]">{scan.status}</span>
            </p>
            <p>
              Progress: <span className="text-[#f0f6fc]">{scan.processedMessages}</span>
              {scan.totalMessagesEstimate ? ` / ${scan.totalMessagesEstimate}` : ""} messages scanned, {" "}
              <span className="text-[#f0f6fc]">{scan.attachmentsScanned}</span> attachments parsed.
            </p>
            {statusText ? <p className="mt-1 text-xs text-[#58a6ff]">{statusText}</p> : null}
          </div>
        ) : null}
      </section>

      {scan?.summary ? <SecurityReport summary={scan.summary} /> : null}
      <ScanResults findings={scan?.findings ?? []} />
      <RedactionTool />

      {findingsCount > 0 ? (
        <section className="rounded-2xl border border-[#263144] bg-[#101722] p-6">
          <h3 className="font-[var(--font-space-grotesk)] text-xl font-semibold text-[#f0f6fc]">
            Immediate remediation checklist
          </h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-[#c9d1d9]">
            <li>Rotate all critical credentials found in this report within 24 hours.</li>
            <li>Remove leaked keys from old email chains and shared docs with the redaction tool.</li>
            <li>Move secrets to a manager and restrict mailbox sharing for sensitive accounts.</li>
          </ol>
        </section>
      ) : null}
    </div>
  );
}
