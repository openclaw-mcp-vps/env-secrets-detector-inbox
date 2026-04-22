import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ScanLauncher } from "@/components/ScanLauncher";
import { getAuthorizedUserIdFromCookieStore } from "@/lib/auth";
import { ensureUser, getLatestScanForUser, getUserById, listRecentScansForUser } from "@/lib/database";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const userId = getAuthorizedUserIdFromCookieStore((name) => cookieStore.get(name));

  if (!userId) {
    redirect("/");
  }

  await ensureUser(userId);
  const user = await getUserById(userId);
  const latestScan = await getLatestScanForUser(userId);
  const recentScans = await listRecentScansForUser(userId, 6);

  return (
    <main className="min-h-screen bg-[#0d1117] px-5 py-10 text-[#e6edf3] sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-[#263144] bg-[#101722] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[#8b949e]">Paid dashboard</p>
              <h1 className="mt-2 font-[var(--font-space-grotesk)] text-3xl font-bold text-[#f0f6fc]">
                Inbox Secrets Detector
              </h1>
              <p className="mt-2 text-sm text-[#8b949e]">
                Connected mailbox: {user?.paidEmail || "not recorded"} | Gmail status:{" "}
                <span className={user?.gmailTokens ? "text-[#3fb950]" : "text-[#d29922]"}>
                  {user?.gmailTokens ? "connected" : "not connected"}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                href="/api/auth/gmail"
                className="inline-flex items-center rounded-lg bg-[#1f6feb] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#388bfd]"
              >
                {user?.gmailTokens ? "Reconnect Gmail" : "Connect Gmail"}
              </a>
              <Link
                href="/"
                className="inline-flex items-center rounded-lg border border-[#30363d] px-4 py-2 text-sm text-[#c9d1d9] transition hover:border-[#58a6ff]"
              >
                Billing & access
              </Link>
            </div>
          </div>
        </header>

        <ScanLauncher gmailConnected={Boolean(user?.gmailTokens)} initialScan={latestScan} />

        <section className="rounded-2xl border border-[#263144] bg-[#101722] p-6">
          <h2 className="font-[var(--font-space-grotesk)] text-xl font-semibold text-[#f0f6fc]">Recent jobs</h2>

          {recentScans.length === 0 ? (
            <p className="mt-3 text-sm text-[#8b949e]">No scan jobs yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-[#8b949e]">
                  <tr>
                    <th className="px-2 py-2">Created</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2">Messages</th>
                    <th className="px-2 py-2">Findings</th>
                    <th className="px-2 py-2">Query</th>
                  </tr>
                </thead>
                <tbody>
                  {recentScans.map((scan) => (
                    <tr key={scan.id} className="border-t border-[#21262d] text-[#c9d1d9]">
                      <td className="px-2 py-2">{new Date(scan.createdAt).toLocaleString()}</td>
                      <td className="px-2 py-2">{scan.status}</td>
                      <td className="px-2 py-2">{scan.processedMessages}</td>
                      <td className="px-2 py-2">{scan.summary.totalFindings}</td>
                      <td className="px-2 py-2">{scan.query}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
