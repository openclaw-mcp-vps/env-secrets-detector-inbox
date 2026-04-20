import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { ScanSummary } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "app-db.json");

const tokenSchema = z.object({
  access_token: z.string().nullable().optional(),
  refresh_token: z.string().nullable().optional(),
  scope: z.string().nullable().optional(),
  token_type: z.string().nullable().optional(),
  expiry_date: z.number().nullable().optional()
});

const gmailConnectionSchema = z.object({
  mailbox: z.string().email(),
  tokens: tokenSchema,
  updatedAt: z.string()
});

const paidMailboxSchema = z.object({
  mailbox: z.string().email(),
  orderId: z.string().optional(),
  customerId: z.string().optional(),
  sourceEvent: z.string(),
  paidAt: z.string(),
  validUntil: z.string().optional()
});

const scanRunSchema = z.object({
  summary: z.custom<ScanSummary>(),
  createdAt: z.string()
});

const dbSchema = z.object({
  gmailConnections: z.record(gmailConnectionSchema).default({}),
  paidMailboxes: z.record(paidMailboxSchema).default({}),
  scanRuns: z.array(scanRunSchema).default([])
});

type DatabaseSchema = z.infer<typeof dbSchema>;
type GmailTokens = z.infer<typeof tokenSchema>;

type PaidMailbox = z.infer<typeof paidMailboxSchema>;

let writeQueue: Promise<unknown> = Promise.resolve();

async function ensureDb(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    await readFile(DB_PATH, "utf8");
  } catch {
    const emptyDb: DatabaseSchema = {
      gmailConnections: {},
      paidMailboxes: {},
      scanRuns: []
    };
    await writeFile(DB_PATH, JSON.stringify(emptyDb, null, 2), "utf8");
  }
}

async function readDb(): Promise<DatabaseSchema> {
  await ensureDb();
  const raw = await readFile(DB_PATH, "utf8");

  try {
    const parsed = JSON.parse(raw);
    return dbSchema.parse(parsed);
  } catch {
    const resetDb: DatabaseSchema = {
      gmailConnections: {},
      paidMailboxes: {},
      scanRuns: []
    };
    await writeFile(DB_PATH, JSON.stringify(resetDb, null, 2), "utf8");
    return resetDb;
  }
}

async function commitDb(db: DatabaseSchema): Promise<void> {
  await writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

async function withWriteLock<T>(mutator: (db: DatabaseSchema) => Promise<T> | T): Promise<T> {
  const current = writeQueue.then(async () => {
    const db = await readDb();
    const result = await mutator(db);
    await commitDb(db);
    return result;
  });

  writeQueue = current.then(
    () => undefined,
    () => undefined
  );

  return current;
}

export async function upsertGmailConnection(mailbox: string, tokens: GmailTokens): Promise<void> {
  await withWriteLock((db) => {
    db.gmailConnections[mailbox.toLowerCase()] = {
      mailbox: mailbox.toLowerCase(),
      tokens,
      updatedAt: new Date().toISOString()
    };
  });
}

export async function getGmailConnection(mailbox: string): Promise<{ mailbox: string; tokens: GmailTokens } | null> {
  const db = await readDb();
  return db.gmailConnections[mailbox.toLowerCase()] ?? null;
}

export async function upsertPaidMailbox(payload: PaidMailbox): Promise<void> {
  await withWriteLock((db) => {
    db.paidMailboxes[payload.mailbox.toLowerCase()] = {
      ...payload,
      mailbox: payload.mailbox.toLowerCase()
    };
  });
}

export async function getPaidMailbox(mailbox: string): Promise<PaidMailbox | null> {
  const db = await readDb();
  return db.paidMailboxes[mailbox.toLowerCase()] ?? null;
}

export async function isMailboxPaid(mailbox: string): Promise<boolean> {
  const paid = await getPaidMailbox(mailbox);
  if (!paid) {
    return false;
  }

  if (paid.validUntil) {
    return new Date(paid.validUntil).getTime() > Date.now();
  }

  return true;
}

export async function saveScanSummary(summary: ScanSummary): Promise<void> {
  await withWriteLock((db) => {
    db.scanRuns.unshift({
      summary,
      createdAt: new Date().toISOString()
    });

    db.scanRuns = db.scanRuns.slice(0, 50);
  });
}

export async function getLatestScanSummary(mailbox: string): Promise<ScanSummary | null> {
  const db = await readDb();
  const run = db.scanRuns.find((entry) => entry.summary.mailbox === mailbox.toLowerCase());
  return run?.summary ?? null;
}
