import Link from "next/link";
import { cookies } from "next/headers";
import { AlertCircle, CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { Pricing } from "@/components/pricing";
import { RedactionTool } from "@/components/redaction-tool";
import { ScanResults } from "@/components/scan-results";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GMAIL_MAILBOX_COOKIE, PAYWALL_COOKIE } from "@/lib/constants";
import { getGmailConnection, getLatestScanSummary, isMailboxPaid } from "@/lib/database";

export const dynamic = "force-dynamic";

export default async function DashboardPage(): Promise<React.ReactElement> {
  const cookieStore = await cookies();
  const mailbox = cookieStore.get(GMAIL_MAILBOX_COOKIE)?.value ?? "";
  const paidCookieEnabled = cookieStore.get(PAYWALL_COOKIE)?.value === "1";
  const paidInDb = mailbox ? await isMailboxPaid(mailbox) : false;
  const isPaid = paidCookieEnabled && paidInDb;

  const gmailConnection = mailbox ? await getGmailConnection(mailbox) : null;
  const latestSummary = isPaid && mailbox ? await getLatestScanSummary(mailbox) : null;

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Inbox Secrets Detector</p>
          <h1 className="text-2xl font-semibold text-slate-100">Security Dashboard</h1>
          <p className="text-sm text-slate-400">Scan Gmail threads and attachments for leaked credentials, then redact safely.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/">
            <Button variant="outline">Back to landing</Button>
          </Link>
        </div>
      </header>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card className="border-slate-800 bg-slate-950/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-300">Paywall status</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            {isPaid ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <AlertCircle className="h-5 w-5 text-amber-400" />}
            <span className="text-sm text-slate-200">{isPaid ? "Unlocked" : "Locked"}</span>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-950/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-300">Gmail connection</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            {gmailConnection ? <Mail className="h-5 w-5 text-teal-300" /> : <AlertCircle className="h-5 w-5 text-amber-400" />}
            <span className="text-sm text-slate-200">{gmailConnection ? mailbox : "Not connected"}</span>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-950/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-300">Last scan</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-slate-200">
            <ShieldCheck className="h-5 w-5 text-teal-300" />
            {latestSummary ? `${latestSummary.totalFindings} findings` : "No scans yet"}
          </CardContent>
        </Card>
      </div>

      {!isPaid ? (
        <section className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <Card className="border-slate-800 bg-slate-950/70">
            <CardHeader>
              <Badge className="w-fit" variant="warning">
                Paywall enabled
              </Badge>
              <CardTitle className="mt-2 text-xl">Unlock mailbox scanning</CardTitle>
              <CardDescription>
                Complete checkout to activate your mailbox cookie and access full inbox scanning + redaction.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-300">
              <p>1. Checkout with the same email as the mailbox you want to secure.</p>
              <p>2. Webhook records your active entitlement.</p>
              <p>3. Use “I already paid, unlock now” to set your secure access cookie.</p>
            </CardContent>
          </Card>
          <Pricing defaultMailbox={mailbox} compact />
        </section>
      ) : !gmailConnection ? (
        <section className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <Card className="border-slate-800 bg-slate-950/70">
            <CardHeader>
              <Badge className="w-fit">Step 2 of 2</Badge>
              <CardTitle className="mt-2 text-xl">Connect Gmail read-only access</CardTitle>
              <CardDescription>
                The scanner needs read-only OAuth to parse message body and attachment text for credential leaks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a href="/api/auth/gmail">
                <Button>Connect Gmail</Button>
              </a>
            </CardContent>
          </Card>
          <Card className="border-slate-800 bg-slate-950/70">
            <CardHeader>
              <CardTitle className="text-lg">Permission scope used</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-300">
              <p>
                <code>https://www.googleapis.com/auth/gmail.readonly</code>
              </p>
              <p>No send, delete, or modify scopes are requested.</p>
            </CardContent>
          </Card>
        </section>
      ) : (
        <section className="space-y-5">
          <ScanResults mailbox={mailbox} initialSummary={latestSummary} />
          <RedactionTool />
        </section>
      )}
    </main>
  );
}
