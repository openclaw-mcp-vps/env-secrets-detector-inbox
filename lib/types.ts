export type SecretSeverity = "critical" | "high" | "medium" | "low";

export interface SecretFinding {
  patternId: string;
  patternName: string;
  severity: SecretSeverity;
  category: string;
  value: string;
  maskedValue: string;
  source: string;
  line: number;
  start: number;
  end: number;
  context: string;
}

export interface SeverityBreakdown {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface TopSecretType {
  name: string;
  count: number;
}

export interface ScanEmailResult {
  messageId: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  findings: SecretFinding[];
  attachmentCount: number;
}

export interface ScanSummary {
  scanId: string;
  mailbox: string;
  scannedAt: string;
  totalMessagesScanned: number;
  flaggedMessages: number;
  totalFindings: number;
  severity: SeverityBreakdown;
  riskScore: number;
  topTypes: TopSecretType[];
}

export interface ScanApiResponse extends ScanSummary {
  results: ScanEmailResult[];
}
