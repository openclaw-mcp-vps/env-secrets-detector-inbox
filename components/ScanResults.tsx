"use client";

import type { SecretFinding } from "@/lib/types";

function severityClass(severity: SecretFinding["severity"]): string {
  if (severity === "critical") return "bg-[#da3633]/20 text-[#ff7b72] border-[#f85149]/40";
  if (severity === "high") return "bg-[#bb8009]/20 text-[#d29922] border-[#d29922]/40";
  if (severity === "medium") return "bg-[#1f6feb]/20 text-[#58a6ff] border-[#58a6ff]/40";
  return "bg-[#2ea043]/20 text-[#3fb950] border-[#3fb950]/40";
}

export function ScanResults({ findings }: { findings: SecretFinding[] }) {
  if (!findings.length) {
    return (
      <div className="rounded-2xl border border-[#263144] bg-[#101722] p-6">
        <h3 className="font-[var(--font-space-grotesk)] text-xl font-semibold text-[#f0f6fc]">
          Findings
        </h3>
        <p className="mt-2 text-sm text-[#8b949e]">
          No leaked credentials detected in this scan. Keep scanning periodically as your inbox
          changes.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#263144] bg-[#101722] p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-[var(--font-space-grotesk)] text-xl font-semibold text-[#f0f6fc]">
          Findings ({findings.length})
        </h3>
        <p className="text-xs text-[#8b949e]">Secret previews are masked and hashed.</p>
      </div>

      <div className="space-y-3">
        {findings.map((finding) => (
          <article
            key={finding.id}
            className="rounded-xl border border-[#30363d] bg-[#0d1117] p-4 transition hover:border-[#58a6ff]/40"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2 py-1 text-xs font-medium ${severityClass(finding.severity)}`}>
                {finding.severity.toUpperCase()}
              </span>
              <p className="text-sm font-semibold text-[#f0f6fc]">{finding.patternName}</p>
              <p className="text-xs text-[#8b949e]">Fingerprint: {finding.fingerprint}</p>
            </div>

            <p className="mt-2 text-sm text-[#c9d1d9]">{finding.description}</p>

            <div className="mt-3 grid gap-2 text-xs text-[#8b949e] sm:grid-cols-2">
              <p>
                <span className="text-[#f0f6fc]">Message:</span> {finding.subject}
              </p>
              <p>
                <span className="text-[#f0f6fc]">Sender:</span> {finding.from}
              </p>
              <p>
                <span className="text-[#f0f6fc]">Source:</span>{" "}
                {finding.source === "attachment"
                  ? `Attachment (${finding.attachmentName || "unnamed"})`
                  : "Email Body"}
              </p>
              <p>
                <span className="text-[#f0f6fc]">Detected:</span>{" "}
                {new Date(finding.internalDate).toLocaleString()}
              </p>
            </div>

            <p className="mt-3 rounded-md border border-[#21262d] bg-[#0f1622] p-3 text-xs text-[#c9d1d9]">
              <span className="mr-1 text-[#8b949e]">Context:</span>
              {finding.context || finding.snippet || "No textual context available."}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
