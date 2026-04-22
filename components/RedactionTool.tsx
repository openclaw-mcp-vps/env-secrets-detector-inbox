"use client";

import { useMemo, useState } from "react";
import { redactSecretsInText } from "@/lib/scanner";

export function RedactionTool() {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => redactSecretsInText(input), [input]);

  async function copyOutput() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="rounded-2xl border border-[#263144] bg-[#101722] p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="font-[var(--font-space-grotesk)] text-xl font-semibold text-[#f0f6fc]">
          Redaction Tool
        </h3>
        <button
          type="button"
          onClick={copyOutput}
          className="rounded-lg border border-[#30363d] px-3 py-1.5 text-xs text-[#c9d1d9] transition hover:border-[#58a6ff]"
        >
          {copied ? "Copied" : "Copy redacted text"}
        </button>
      </div>

      <p className="mb-4 text-sm text-[#8b949e]">
        Paste any email draft or support reply and instantly replace detected credentials with
        structured redaction labels.
      </p>

      <div className="grid gap-3 lg:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs uppercase tracking-wide text-[#8b949e]">Original text</label>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Paste text with possible keys here..."
            className="h-52 w-full rounded-lg border border-[#30363d] bg-[#0d1117] p-3 text-sm text-[#e6edf3] outline-none transition focus:border-[#58a6ff]"
          />
        </div>
        <div>
          <label className="mb-2 block text-xs uppercase tracking-wide text-[#8b949e]">Redacted output</label>
          <textarea
            value={output}
            readOnly
            className="h-52 w-full rounded-lg border border-[#30363d] bg-[#0b1220] p-3 text-sm text-[#f0f6fc]"
          />
        </div>
      </div>
    </div>
  );
}
