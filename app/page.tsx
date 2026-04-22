import Link from "next/link";
import { cookies } from "next/headers";
import { AlertTriangle, CheckCircle2, Shield, Zap } from "lucide-react";
import { UnlockAccessForm } from "@/components/UnlockAccessForm";
import { PATTERN_COUNT } from "@/lib/patterns";
import { getAuthorizedUserIdFromCookieStore } from "@/lib/auth";

const faqs = [
  {
    q: "Does this read my mailbox contents permanently?",
    a: "The scanner reads messages and attachments using Gmail read-only scope, then stores only masked previews + hashed fingerprints of suspected secrets. Raw keys are never persisted."
  },
  {
    q: "What types of leaks does it detect?",
    a: "It scans for 50+ credential classes including AWS, Stripe, GitHub, OpenAI, connection URIs, private key blocks, and generic password/token assignments."
  },
  {
    q: "Why use this instead of DLP in my email provider?",
    a: "Most SMB inboxes never configure DLP rules. This gives founders a fast, self-serve scan focused on real secret patterns and attachment extraction without enterprise setup overhead."
  },
  {
    q: "How does billing work?",
    a: "Pricing is $19 per mailbox per month. Checkout is hosted by Stripe. After purchase, unlock the dashboard with your checkout email or Stripe session ID."
  }
];

export default async function HomePage() {
  const stripeLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;
  const cookieStore = await cookies();
  const hasAccess = Boolean(getAuthorizedUserIdFromCookieStore((name) => cookieStore.get(name)));

  return (
    <main className="bg-[#0d1117] text-[#e6edf3]">
      <section className="relative overflow-hidden border-b border-[#21262d]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,139,253,0.2),transparent_42%),radial-gradient(circle_at_80%_0%,rgba(63,185,80,0.15),transparent_36%)]" />
        <div className="relative mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="inline-flex items-center rounded-full border border-[#30363d] bg-[#101722] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[#8b949e]">
                Inbox Secrets Detector
              </p>
              <h1 className="mt-5 font-[var(--font-space-grotesk)] text-4xl font-bold leading-tight text-[#f0f6fc] sm:text-5xl">
                Scan Gmail for accidentally leaked API keys before attackers find them.
              </h1>
              <p className="mt-5 max-w-2xl text-base text-[#c9d1d9] sm:text-lg">
                Founders leak secrets in support threads, forwarded screenshots, and shared docs every
                week. Connect Gmail read-only, scan body text + attachments, and get a remediation
                report with redaction-ready output.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a
                  href={stripeLink}
                  className="inline-flex items-center justify-center rounded-lg bg-[#238636] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2ea043]"
                >
                  Buy Access — $19/month
                </a>
                <Link
                  href={hasAccess ? "/dashboard" : "#unlock"}
                  className="inline-flex items-center justify-center rounded-lg border border-[#30363d] px-5 py-3 text-sm font-semibold text-[#c9d1d9] transition hover:border-[#58a6ff]"
                >
                  {hasAccess ? "Open Dashboard" : "I already paid"}
                </Link>
              </div>

              {!stripeLink ? (
                <p className="mt-3 text-sm text-[#ff7b72]">
                  Missing `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` in environment configuration.
                </p>
              ) : null}

              <div className="mt-8 grid gap-3 text-sm text-[#8b949e] sm:grid-cols-3">
                <p className="rounded-lg border border-[#263144] bg-[#101722] px-3 py-2">
                  <Shield className="mr-2 inline h-4 w-4 text-[#58a6ff]" /> Read-only Gmail OAuth
                </p>
                <p className="rounded-lg border border-[#263144] bg-[#101722] px-3 py-2">
                  <Zap className="mr-2 inline h-4 w-4 text-[#d29922]" /> {PATTERN_COUNT}+ key patterns
                </p>
                <p className="rounded-lg border border-[#263144] bg-[#101722] px-3 py-2">
                  <CheckCircle2 className="mr-2 inline h-4 w-4 text-[#3fb950]" /> Instant redaction aid
                </p>
              </div>
            </div>

            <div id="unlock">
              <UnlockAccessForm />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-[#30363d] bg-[#101722] p-5">
            <h2 className="font-[var(--font-space-grotesk)] text-lg font-semibold text-[#f0f6fc]">
              The problem
            </h2>
            <p className="mt-2 text-sm text-[#c9d1d9]">
              Founders reuse one mailbox for finance, devops, support, and hiring. Sensitive tokens
              end up in forwarded chains and attachments nobody re-audits.
            </p>
          </article>
          <article className="rounded-xl border border-[#30363d] bg-[#101722] p-5">
            <h2 className="font-[var(--font-space-grotesk)] text-lg font-semibold text-[#f0f6fc]">
              The solution
            </h2>
            <p className="mt-2 text-sm text-[#c9d1d9]">
              We scan historical and new mailbox content with credential-specific detection patterns,
              then convert findings into a prioritized security report.
            </p>
          </article>
          <article className="rounded-xl border border-[#30363d] bg-[#101722] p-5">
            <h2 className="font-[var(--font-space-grotesk)] text-lg font-semibold text-[#f0f6fc]">
              Why it matters
            </h2>
            <p className="mt-2 text-sm text-[#c9d1d9]">
              Credential leaks in email are quietly exploitable. Catching one exposed key can prevent
              account takeover, infra abuse, and painful incident response.
            </p>
          </article>
        </div>
      </section>

      <section className="border-y border-[#21262d] bg-[#0f1724]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <h2 className="font-[var(--font-space-grotesk)] text-3xl font-semibold text-[#f0f6fc]">Pricing</h2>
          <p className="mt-3 max-w-2xl text-sm text-[#8b949e]">
            Built for security-conscious solo founders who need one clear answer: “Did we leak any
            credentials in email?”
          </p>

          <div className="mt-6 max-w-xl rounded-2xl border border-[#30363d] bg-[#101722] p-6">
            <p className="text-sm uppercase tracking-wide text-[#8b949e]">Starter mailbox</p>
            <p className="mt-2 font-[var(--font-space-grotesk)] text-4xl font-bold text-[#f0f6fc]">
              $19<span className="text-lg font-medium text-[#8b949e]">/month</span>
            </p>
            <ul className="mt-4 space-y-2 text-sm text-[#c9d1d9]">
              <li>Read-only Gmail OAuth connection</li>
              <li>Body + attachment scanning</li>
              <li>{PATTERN_COUNT}+ credential detection patterns</li>
              <li>Redaction and remediation report</li>
              <li>Cookie-based paid dashboard access</li>
            </ul>
            <a
              href={stripeLink}
              className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-[#238636] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2ea043]"
            >
              Buy with Stripe
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-16 sm:px-8">
        <h2 className="font-[var(--font-space-grotesk)] text-3xl font-semibold text-[#f0f6fc]">FAQ</h2>
        <div className="mt-6 space-y-4">
          {faqs.map((item) => (
            <article key={item.q} className="rounded-xl border border-[#30363d] bg-[#101722] p-5">
              <h3 className="text-base font-semibold text-[#f0f6fc]">{item.q}</h3>
              <p className="mt-2 text-sm text-[#c9d1d9]">{item.a}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-[#f85149]/35 bg-[#201316] p-4 text-sm text-[#ff7b72]">
          <AlertTriangle className="mr-2 inline h-4 w-4" />
          Secrets leak most often through “temporary” messages. Run a full scan now, then re-scan
          weekly.
        </div>
      </section>
    </main>
  );
}
