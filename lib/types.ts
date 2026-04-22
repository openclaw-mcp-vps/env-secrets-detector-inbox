export type Severity = "critical" | "high" | "medium" | "low";

export interface SecretPatternDefinition {
  id: string;
  name: string;
  description: string;
  severity: Severity;
  regex: RegExp;
  redactionLabel: string;
}

export interface TextSecretMatch {
  patternId: string;
  patternName: string;
  severity: Severity;
  description: string;
  value: string;
  start: number;
  end: number;
  context: string;
}

export interface SecretFinding {
  id: string;
  patternId: string;
  patternName: string;
  severity: Severity;
  description: string;
  fingerprint: string;
  preview: string;
  context: string;
  source: "body" | "attachment";
  attachmentName?: string;
  messageId: string;
  threadId: string;
  subject: string;
  from: string;
  internalDate: string;
  snippet: string;
  createdAt: string;
}

export interface ScanSummary {
  totalFindings: number;
  uniqueSecrets: number;
  bySeverity: Record<Severity, number>;
  byPattern: Record<string, number>;
  messagesScanned: number;
  attachmentsScanned: number;
  riskyMessages: number;
}

export type ScanStatus = "queued" | "running" | "completed" | "failed";

export interface ScanJobRecord {
  id: string;
  userId: string;
  status: ScanStatus;
  query: string;
  maxMessages: number;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  processedMessages: number;
  totalMessagesEstimate?: number;
  attachmentsScanned: number;
  findings: SecretFinding[];
  summary: ScanSummary;
  errors: string[];
}

export interface StoredGmailTokens {
  access_token?: string | null;
  refresh_token?: string | null;
  scope?: string | null;
  token_type?: string | null;
  expiry_date?: number | null;
  id_token?: string | null;
}

export interface UserRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  paid: boolean;
  paidEmail?: string;
  paidSource?: "webhook" | "session-verify" | "manual";
  paidAt?: string;
  gmailConnectedAt?: string;
  gmailTokens?: StoredGmailTokens;
}

export interface EntitlementRecord {
  email: string;
  active: boolean;
  source: "stripe-webhook" | "manual";
  stripeCustomerId?: string;
  checkoutSessionId?: string;
  updatedAt: string;
}

export interface WebhookEventRecord {
  eventId: string;
  type: string;
  receivedAt: string;
}

export interface DatabaseShape {
  users: UserRecord[];
  scans: ScanJobRecord[];
  entitlements: EntitlementRecord[];
  webhookEvents: WebhookEventRecord[];
}

export interface ScannableAttachment {
  filename: string;
  mimeType: string;
  textContent: string;
}

export interface ScannableMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  internalDate: string;
  snippet: string;
  bodyText: string;
  attachments: ScannableAttachment[];
}
