"use client";

import { useMemo, useState } from "react";
import { Copy, ScissorsLineDashed, ShieldAlert } from "lucide-react";
import { detectSecretsInText, redactDetectedSecrets } from "@/lib/secrets-detector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { SecretFinding } from "@/lib/types";

const EXAMPLE_TEXT = `Paste email snippets, configs, terminal output, or copied attachment text here.
Example:
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
STRIPE_KEY=sk_live_51Nkj5QexamplelA7s...
postgres://admin:myS3cretPass@db.internal:5432/prod`;

function severityBadge(finding: SecretFinding): "danger" | "warning" | "outline" {
  if (finding.severity === "critical" || finding.severity === "high") {
    return "danger";
  }

  if (finding.severity === "medium") {
    return "warning";
  }

  return "outline";
}

export function RedactionTool(): React.ReactElement {
  const [sourceText, setSourceText] = useState(EXAMPLE_TEXT);
  const [findings, setFindings] = useState<SecretFinding[]>([]);
  const [redacted, setRedacted] = useState("");
  const [status, setStatus] = useState("");

  const criticalCount = useMemo(
    () => findings.filter((item) => item.severity === "critical" || item.severity === "high").length,
    [findings]
  );

  function runRedaction(): void {
    const detected = detectSecretsInText({
      text: sourceText,
      source: "manual-redaction"
    });

    setFindings(detected);
    setRedacted(redactDetectedSecrets(sourceText, detected));

    if (!detected.length) {
      setStatus("No high-confidence credentials found in this text.");
      return;
    }

    setStatus(`Redacted ${detected.length} secret${detected.length > 1 ? "s" : ""}.`);
  }

  async function copyToClipboard(): Promise<void> {
    if (!redacted) {
      return;
    }

    await navigator.clipboard.writeText(redacted);
    setStatus("Redacted output copied to clipboard.");
  }

  return (
    <Card className="border-slate-800 bg-slate-950/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <ScissorsLineDashed className="h-5 w-5 text-teal-300" />
          Redaction Tool
        </CardTitle>
        <CardDescription>
          Quickly scrub exposed credentials from forwarded emails, incident reports, or support replies.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={sourceText}
          onChange={(event) => setSourceText(event.target.value)}
          className="min-h-44"
          spellCheck={false}
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={runRedaction}>Detect + Redact</Button>
          <Button variant="outline" onClick={copyToClipboard} disabled={!redacted}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Redacted Text
          </Button>
          {criticalCount > 0 ? (
            <Badge variant="danger" className="pulse-glow">
              <ShieldAlert className="mr-1 h-3.5 w-3.5" />
              {criticalCount} critical/high findings
            </Badge>
          ) : null}
        </div>

        {status ? (
          <p className="rounded-md border border-slate-800 bg-slate-900/70 p-3 text-sm text-slate-300">{status}</p>
        ) : null}

        {findings.length > 0 ? (
          <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/50 p-3">
            <p className="text-sm font-medium text-slate-200">Detected credentials</p>
            <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
              {findings.map((item, index) => (
                <div key={`${item.patternId}-${index}`} className="rounded-md border border-slate-800 bg-slate-950/70 p-2 text-sm">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge variant={severityBadge(item)}>{item.severity.toUpperCase()}</Badge>
                    <span className="font-medium text-slate-100">{item.patternName}</span>
                    <code className="text-xs text-slate-400">{item.maskedValue}</code>
                  </div>
                  <p className="text-xs text-slate-400">{item.context}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {redacted ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-200">Redacted output</p>
            <Textarea value={redacted} readOnly className="min-h-44 font-mono text-xs" />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
