import Link from "next/link";
import { AlertTriangle, CheckCircle2, Lock, MailSearch, Shield, Sparkles } from "lucide-react";
import { Pricing } from "@/components/pricing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const problemPoints = [
  "Founders forward staging configs or API debug logs to contractors.",
  "Thread screenshots and copied snippets leak secrets into inbox history forever.",
  "No existing scanner crawls both message body and attachments in one security pass."
];

const capabilities = [
  {
    title: "Deep Gmail Sweep",
    description: "Read-only OAuth access scans message body, thread snippets, and supported attachment text for leaks.",
    icon: MailSearch
  },
  {
    title: "50+ Secret Signatures",
    description: "Detect AWS, Stripe, OpenAI, GitHub, database URIs, private keys, OAuth tokens, and common password patterns.",
    icon: Shield
  },
  {
    title: "Immediate Redaction",
    description: "Generate cleaned text instantly for forwarding, incident updates, or support responses without exposing credentials.",
    icon: Lock
  }
];

const faqItems = [
  {
    q: "Does this send my email data to a third party?",
    a: "No. Scans run in your app environment with Gmail read-only access. The app stores only scan summaries and masked findings."
  },
  {
    q: "Which attachments are scanned?",
    a: "Text-based attachments are parsed directly. Binary files are analyzed for printable credential-like strings to catch embedded plaintext leaks."
  },
  {
    q: "Can I use this for multiple inboxes?",
    a: "Yes. Billing is per mailbox at $19/month. Connect each Gmail inbox separately and run scans independently."
  },
  {
    q: "How does payment unlock scanning?",
    a: "Checkout is handled with Lemon Squeezy overlay. After successful purchase and webhook confirmation, a secure cookie unlocks the scanner for that mailbox."
  }
];

export default function HomePage(): React.ReactElement {
  return (
    <main className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-7 shadow-[0_0_80px_-30px_rgba(45,212,191,0.35)] backdrop-blur sm:p-10">
          <Badge>Security for founder inboxes</Badge>
          <div className="mt-4 grid gap-7 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            <div>
              <h1 className="text-3xl font-semibold leading-tight text-slate-100 sm:text-5xl">
                Inbox Secrets Detector
                <span className="block text-teal-300">scan your email for leaked API keys + credentials</span>
              </h1>
              <p className="mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
                The fastest way to catch secrets accidentally shared in email threads, screenshots, and copied logs. Connect Gmail,
                scan in minutes, and ship a security report your team can act on.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button className="w-full" size="lg">
                    Start Inbox Scan
                  </Button>
                </Link>
                <a href="#pricing" className="w-full sm:w-auto">
                  <Button className="w-full" size="lg" variant="outline">
                    View Pricing
                  </Button>
                </a>
              </div>
            </div>
            <Card className="border-emerald-900/30 bg-gradient-to-b from-emerald-950/30 to-slate-950/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-emerald-300" />
                  Why founders pay for this
                </CardTitle>
                <CardDescription>Most credential leaks are accidental and happen in internal email loops.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-300">
                <p className="rounded-md border border-slate-800 bg-slate-900/70 p-3">Find leaked keys before contractors, vendors, or inbox breaches do.</p>
                <p className="rounded-md border border-slate-800 bg-slate-900/70 p-3">Run scans before fundraising diligence, SOC2 prep, and incident response.</p>
                <p className="rounded-md border border-slate-800 bg-slate-900/70 p-3">Get immediate redaction output to fix threads without slowing work.</p>
              </CardContent>
            </Card>
          </div>
        </header>

        <section className="mt-12">
          <div className="mb-4 flex items-center gap-2 text-slate-100">
            <AlertTriangle className="h-5 w-5 text-rose-300" />
            <h2 className="text-2xl font-semibold">The Problem Nobody Scans</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {problemPoints.map((item) => (
              <Card key={item} className="border-slate-800 bg-slate-950/70">
                <CardContent className="pt-6 text-sm text-slate-300">{item}</CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="mb-4 text-2xl font-semibold text-slate-100">How Inbox Secrets Detector Works</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {capabilities.map((capability) => (
              <Card key={capability.title} className="border-slate-800 bg-slate-950/70">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <capability.icon className="h-5 w-5 text-teal-300" />
                    {capability.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-300">{capability.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="pricing" className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-start">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
            <h2 className="text-2xl font-semibold text-slate-100">One plan, one goal</h2>
            <p className="mt-3 text-slate-300">
              Protect the inbox where operations, product logs, and vendor access requests all collide. No seat pricing, no feature tiers,
              just one fixed cost per mailbox.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-teal-300" />
                Full scan engine with attachment analysis
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-teal-300" />
                Security score and top risk categories
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-teal-300" />
                Redaction utility for response workflows
              </li>
            </ul>
          </div>
          <Pricing />
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-slate-100">FAQ</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {faqItems.map((item) => (
              <Card key={item.q} className="border-slate-800 bg-slate-950/70">
                <CardHeader>
                  <CardTitle className="text-base">{item.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-300">{item.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
