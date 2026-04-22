import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type {
  DatabaseShape,
  EntitlementRecord,
  ScanJobRecord,
  ScanSummary,
  SecretFinding,
  StoredGmailTokens,
  UserRecord,
  WebhookEventRecord
} from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "store.json");

const DEFAULT_SUMMARY: ScanSummary = {
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
};

const DEFAULT_DB: DatabaseShape = {
  users: [],
  scans: [],
  entitlements: [],
  webhookEvents: []
};

let writeQueue = Promise.resolve();

async function ensureDbFile(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(DB_FILE, "utf8");
  } catch {
    await writeFile(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), "utf8");
  }
}

async function readDb(): Promise<DatabaseShape> {
  await ensureDbFile();

  try {
    const raw = await readFile(DB_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<DatabaseShape>;

    return {
      users: parsed.users ?? [],
      scans: parsed.scans ?? [],
      entitlements: parsed.entitlements ?? [],
      webhookEvents: parsed.webhookEvents ?? []
    };
  } catch {
    return { ...DEFAULT_DB };
  }
}

async function writeDb(db: DatabaseShape): Promise<void> {
  await ensureDbFile();
  const temp = `${DB_FILE}.tmp`;
  await writeFile(temp, JSON.stringify(db, null, 2), "utf8");
  await rename(temp, DB_FILE);
}

async function mutateDb<T>(fn: (db: DatabaseShape) => T | Promise<T>): Promise<T> {
  const pending = writeQueue.then(async () => {
    const db = await readDb();
    const value = await fn(db);
    await writeDb(db);
    return value;
  });

  writeQueue = pending.then(
    () => undefined,
    () => undefined
  );

  return pending;
}

export async function ensureUser(userId: string): Promise<UserRecord> {
  return mutateDb((db) => {
    const existing = db.users.find((user) => user.id === userId);
    if (existing) return existing;

    const now = new Date().toISOString();
    const created: UserRecord = {
      id: userId,
      createdAt: now,
      updatedAt: now,
      paid: false
    };

    db.users.push(created);
    return created;
  });
}

export async function getUserById(userId: string): Promise<UserRecord | null> {
  const db = await readDb();
  return db.users.find((user) => user.id === userId) ?? null;
}

export async function saveUserGmailTokens(userId: string, tokens: StoredGmailTokens): Promise<void> {
  await mutateDb((db) => {
    const user = db.users.find((item) => item.id === userId);
    if (!user) return;

    user.gmailTokens = {
      ...user.gmailTokens,
      ...tokens,
      refresh_token: tokens.refresh_token ?? user.gmailTokens?.refresh_token ?? null
    };
    user.gmailConnectedAt = new Date().toISOString();
    user.updatedAt = new Date().toISOString();
  });
}

export async function clearUserGmailTokens(userId: string): Promise<void> {
  await mutateDb((db) => {
    const user = db.users.find((item) => item.id === userId);
    if (!user) return;

    delete user.gmailTokens;
    user.updatedAt = new Date().toISOString();
  });
}

export async function upsertEntitlement(
  email: string,
  payload: Omit<EntitlementRecord, "email" | "updatedAt">
): Promise<EntitlementRecord> {
  return mutateDb((db) => {
    const normalized = email.trim().toLowerCase();
    const now = new Date().toISOString();
    const found = db.entitlements.find((item) => item.email === normalized);

    if (found) {
      found.active = payload.active;
      found.source = payload.source;
      found.checkoutSessionId = payload.checkoutSessionId;
      found.stripeCustomerId = payload.stripeCustomerId;
      found.updatedAt = now;
      return found;
    }

    const record: EntitlementRecord = {
      email: normalized,
      active: payload.active,
      source: payload.source,
      stripeCustomerId: payload.stripeCustomerId,
      checkoutSessionId: payload.checkoutSessionId,
      updatedAt: now
    };

    db.entitlements.push(record);
    return record;
  });
}

export async function getEntitlementByEmail(email: string): Promise<EntitlementRecord | null> {
  const db = await readDb();
  const normalized = email.trim().toLowerCase();
  return db.entitlements.find((item) => item.email === normalized && item.active) ?? null;
}

export async function activateUserPaidAccess(
  userId: string,
  email: string,
  source: UserRecord["paidSource"]
): Promise<UserRecord | null> {
  return mutateDb((db) => {
    const user = db.users.find((item) => item.id === userId);
    if (!user) return null;

    user.paid = true;
    user.paidEmail = email.trim().toLowerCase();
    user.paidSource = source;
    user.paidAt = new Date().toISOString();
    user.updatedAt = new Date().toISOString();

    return user;
  });
}

export async function isUserPaid(userId: string): Promise<boolean> {
  const user = await getUserById(userId);
  return Boolean(user?.paid);
}

export async function createScanJob(userId: string, query: string, maxMessages: number): Promise<ScanJobRecord> {
  return mutateDb((db) => {
    const now = new Date().toISOString();
    const job: ScanJobRecord = {
      id: randomUUID(),
      userId,
      status: "queued",
      query,
      maxMessages,
      createdAt: now,
      processedMessages: 0,
      attachmentsScanned: 0,
      findings: [],
      summary: { ...DEFAULT_SUMMARY },
      errors: []
    };

    db.scans.push(job);
    return job;
  });
}

export async function patchScanJob(
  scanId: string,
  userId: string,
  patch: Partial<ScanJobRecord>
): Promise<ScanJobRecord | null> {
  return mutateDb((db) => {
    const job = db.scans.find((item) => item.id === scanId && item.userId === userId);
    if (!job) return null;

    Object.assign(job, patch);
    return job;
  });
}

export async function replaceScanFindings(
  scanId: string,
  userId: string,
  findings: SecretFinding[],
  summary: ScanSummary,
  processedMessages: number,
  attachmentsScanned: number
): Promise<ScanJobRecord | null> {
  return mutateDb((db) => {
    const job = db.scans.find((item) => item.id === scanId && item.userId === userId);
    if (!job) return null;

    job.findings = findings;
    job.summary = summary;
    job.processedMessages = processedMessages;
    job.attachmentsScanned = attachmentsScanned;

    return job;
  });
}

export async function appendScanError(scanId: string, userId: string, error: string): Promise<void> {
  await mutateDb((db) => {
    const job = db.scans.find((item) => item.id === scanId && item.userId === userId);
    if (!job) return;

    job.errors.push(error);
  });
}

export async function getScanJob(scanId: string, userId: string): Promise<ScanJobRecord | null> {
  const db = await readDb();
  return db.scans.find((item) => item.id === scanId && item.userId === userId) ?? null;
}

export async function getLatestScanForUser(userId: string): Promise<ScanJobRecord | null> {
  const db = await readDb();
  const scans = db.scans
    .filter((item) => item.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return scans[0] ?? null;
}

export async function listRecentScansForUser(userId: string, limit = 6): Promise<ScanJobRecord[]> {
  const db = await readDb();
  return db.scans
    .filter((item) => item.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export async function hasProcessedWebhookEvent(eventId: string): Promise<boolean> {
  const db = await readDb();
  return db.webhookEvents.some((item) => item.eventId === eventId);
}

export async function markWebhookEventProcessed(record: WebhookEventRecord): Promise<void> {
  await mutateDb((db) => {
    if (db.webhookEvents.some((item) => item.eventId === record.eventId)) {
      return;
    }

    db.webhookEvents.push(record);
  });
}
