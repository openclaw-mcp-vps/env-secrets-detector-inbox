import { SECRET_PATTERNS } from "@/lib/patterns";
import type { ScanSummary, SecretFinding, SecretSeverity, TopSecretType } from "@/lib/types";

const MAX_FINDINGS_PER_PATTERN = 250;

function shannonEntropy(value: string): number {
  if (!value.length) {
    return 0;
  }

  const frequency = new Map<string, number>();
  for (const char of value) {
    frequency.set(char, (frequency.get(char) ?? 0) + 1);
  }

  let entropy = 0;
  for (const count of frequency.values()) {
    const p = count / value.length;
    entropy -= p * Math.log2(p);
  }

  return entropy;
}

function normalizeMatch(match: string): string {
  return match.trim().replace(/\s+/g, " ");
}

function shouldDropMatch(value: string, patternId: string): boolean {
  if (value.length < 8) {
    return true;
  }

  if (patternId === "password_assignment") {
    const lower = value.toLowerCase();
    const weakValues = ["password", "changeme", "secret", "admin", "test1234", "example"];
    if (weakValues.includes(lower)) {
      return true;
    }
  }

  if (patternId === "api_key_assignment" || patternId === "bearer_token_assignment") {
    const uniqueChars = new Set(value.replace(/[^A-Za-z0-9]/g, "")).size;
    if (shannonEntropy(value) < 3 || uniqueChars < 8) {
      return true;
    }
  }

  return false;
}

function maskSecret(value: string): string {
  if (value.length <= 6) {
    return "*".repeat(value.length);
  }

  if (value.length <= 16) {
    return `${value.slice(0, 2)}${"*".repeat(value.length - 4)}${value.slice(-2)}`;
  }

  return `${value.slice(0, 4)}${"*".repeat(Math.max(6, value.length - 8))}${value.slice(-4)}`;
}

function getLineNumber(text: string, index: number): number {
  return text.slice(0, Math.max(0, index)).split(/\r?\n/).length;
}

function getContext(text: string, start: number, end: number): string {
  const contextWindow = 42;
  const left = Math.max(0, start - contextWindow);
  const right = Math.min(text.length, end + contextWindow);
  const before = text.slice(left, start).replace(/\s+/g, " ").trim();
  const hit = text.slice(start, end).replace(/\s+/g, " ").trim();
  const after = text.slice(end, right).replace(/\s+/g, " ").trim();

  return `${before}${before ? " " : ""}[${hit}]${after ? ` ${after}` : ""}`;
}

function normalizedSeverityOrder(severity: SecretSeverity): number {
  switch (severity) {
    case "critical":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    default:
      return 1;
  }
}

export function detectSecretsInText(input: {
  text: string;
  source: string;
}): SecretFinding[] {
  const text = input.text ?? "";
  if (!text.trim()) {
    return [];
  }

  const findings: SecretFinding[] = [];
  const dedupe = new Set<string>();

  for (const pattern of SECRET_PATTERNS) {
    const regex = new RegExp(
      pattern.regex.source,
      pattern.regex.flags.includes("g") ? pattern.regex.flags : `${pattern.regex.flags}g`
    );

    let localCount = 0;
    for (const match of text.matchAll(regex)) {
      if (localCount >= MAX_FINDINGS_PER_PATTERN) {
        break;
      }

      const matchedValue = normalizeMatch(match[1] ?? match[0]);
      if (!matchedValue || shouldDropMatch(matchedValue, pattern.id)) {
        continue;
      }

      const start = typeof match.index === "number" ? match.index : text.indexOf(match[0]);
      if (start < 0) {
        continue;
      }

      const end = start + match[0].length;
      const dedupeKey = `${pattern.id}:${start}:${end}:${matchedValue}`;
      if (dedupe.has(dedupeKey)) {
        continue;
      }
      dedupe.add(dedupeKey);

      findings.push({
        patternId: pattern.id,
        patternName: pattern.name,
        severity: pattern.severity,
        category: pattern.category,
        value: matchedValue,
        maskedValue: maskSecret(matchedValue),
        source: input.source,
        line: getLineNumber(text, start),
        start,
        end,
        context: getContext(text, start, end)
      });

      localCount += 1;
    }
  }

  return findings.sort((a, b) => {
    const severityDelta = normalizedSeverityOrder(b.severity) - normalizedSeverityOrder(a.severity);
    if (severityDelta !== 0) {
      return severityDelta;
    }

    return a.start - b.start;
  });
}

export function redactDetectedSecrets(text: string, findings: SecretFinding[]): string {
  if (!text || !findings.length) {
    return text;
  }

  const ordered = [...findings]
    .filter((item) => item.start >= 0 && item.end > item.start && item.end <= text.length)
    .sort((a, b) => b.start - a.start);

  let redacted = text;
  for (const finding of ordered) {
    const replacement = `[REDACTED:${finding.patternName}]`;
    redacted = `${redacted.slice(0, finding.start)}${replacement}${redacted.slice(finding.end)}`;
  }

  return redacted;
}

export function buildSeverityBreakdown(findings: SecretFinding[]): ScanSummary["severity"] {
  return findings.reduce(
    (acc, finding) => {
      acc[finding.severity] += 1;
      return acc;
    },
    {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    }
  );
}

export function buildTopSecretTypes(findings: SecretFinding[], limit = 8): TopSecretType[] {
  const counts = new Map<string, number>();

  for (const finding of findings) {
    counts.set(finding.patternName, (counts.get(finding.patternName) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function computeRiskScore(findings: SecretFinding[]): number {
  const severity = buildSeverityBreakdown(findings);
  const score = severity.critical * 18 + severity.high * 9 + severity.medium * 4 + severity.low * 2;
  return Math.min(100, score);
}
