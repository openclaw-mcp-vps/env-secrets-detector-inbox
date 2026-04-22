import { SECRET_PATTERNS } from "@/lib/patterns";
import type { ScanSummary, SecretFinding, Severity, TextSecretMatch } from "@/lib/types";

const CONTEXT_RADIUS = 36;

const SEVERITY_EMPTY: Record<Severity, number> = {
  critical: 0,
  high: 0,
  medium: 0,
  low: 0
};

function toContext(text: string, start: number, end: number): string {
  const from = Math.max(0, start - CONTEXT_RADIUS);
  const to = Math.min(text.length, end + CONTEXT_RADIUS);
  return text.slice(from, to).replace(/\s+/g, " ").trim();
}

function pickMatchedValue(match: RegExpExecArray): string {
  if (match.length > 1 && match[1]) {
    return match[1];
  }
  return match[0];
}

export function maskSecret(value: string): string {
  if (!value) return "";

  if (value.length <= 10) {
    return `${value.slice(0, 2)}…${value.slice(-1)}`;
  }

  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

export function scanTextForSecrets(text: string, maxMatchesPerPattern = 50): TextSecretMatch[] {
  if (!text.trim()) {
    return [];
  }

  const matches: TextSecretMatch[] = [];

  for (const pattern of SECRET_PATTERNS) {
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    let counter = 0;
    let hit: RegExpExecArray | null = regex.exec(text);

    while (hit && counter < maxMatchesPerPattern) {
      const value = pickMatchedValue(hit).trim();
      const start = hit.index;
      const end = start + hit[0].length;

      if (value.length >= 8) {
        matches.push({
          patternId: pattern.id,
          patternName: pattern.name,
          severity: pattern.severity,
          description: pattern.description,
          value,
          start,
          end,
          context: toContext(text, start, end)
        });
      }

      counter += 1;

      if (hit[0].length === 0) {
        regex.lastIndex += 1;
      }

      hit = regex.exec(text);
    }
  }

  return matches;
}

export function redactSecretsInText(text: string): string {
  if (!text.trim()) {
    return text;
  }

  let redacted = text;

  for (const pattern of SECRET_PATTERNS) {
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    redacted = redacted.replace(regex, `[REDACTED:${pattern.redactionLabel}]`);
  }

  return redacted;
}

export function buildScanSummary(
  findings: SecretFinding[],
  messagesScanned: number,
  attachmentsScanned: number
): ScanSummary {
  const bySeverity: Record<Severity, number> = { ...SEVERITY_EMPTY };
  const byPattern: Record<string, number> = {};
  const messageIds = new Set<string>();
  const fingerprints = new Set<string>();

  for (const finding of findings) {
    bySeverity[finding.severity] += 1;
    byPattern[finding.patternName] = (byPattern[finding.patternName] ?? 0) + 1;
    messageIds.add(finding.messageId);
    fingerprints.add(finding.fingerprint);
  }

  return {
    totalFindings: findings.length,
    uniqueSecrets: fingerprints.size,
    bySeverity,
    byPattern,
    messagesScanned,
    attachmentsScanned,
    riskyMessages: messageIds.size
  };
}
