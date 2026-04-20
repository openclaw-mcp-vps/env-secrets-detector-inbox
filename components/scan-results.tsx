"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Loader2, MailWarning, ShieldCheck } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import type { ScanApiResponse, ScanSummary } from "@/lib/types";

interface ScanResultsProps {
  mailbox: string;
  initialSummary: ScanSummary | null;
}

const severityColors: Record<string, string> = {
  critical: "#f43f5e",
  high: "#fb7185",
  medium: "#f59e0b",
  low: "#22c55e"
};

function RiskLabel({ score }: { score: number }): React.ReactElement {
  if (score >= 70) {
    return <Badge variant="danger">Critical risk</Badge>;
  }

  if (score >= 40) {
    return <Badge variant="warning">Elevated risk</Badge>;
  }

  return <Badge variant="default">Low risk</Badge>;
}

export function ScanResults({ mailbox, initialSummary }: ScanResultsProps): React.ReactElement {
  const [maxEmails, setMaxEmails] = useState("120");
  const [scan, setScan] = useState<ScanApiResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("");

  const effectiveSummary = scan ?? initialSummary;

  const severityData = useMemo(() => {
    if (!effectiveSummary) {
      return [];
    }

    return [
      { name: "critical", value: effectiveSummary.severity.critical },
      { name: "high", value: effectiveSummary.severity.high },
      { name: "medium", value: effectiveSummary.severity.medium },
      { name: "low", value: effectiveSummary.severity.low }
    ];
  }, [effectiveSummary]);

  async function startScan(): Promise<void> {
    const numeric = Number(maxEmails);
    if (!Number.isFinite(numeric) || numeric < 10 || numeric > 500) {
      setStatus("Choose a scan size between 10 and 500 messages.");
      return;
    }

    setRunning(true);
    setStatus(`Scanning ${mailbox}...`);

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ maxEmails: numeric })
      });

      const payload = (await response.json()) as ScanApiResponse & { message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "Scan failed.");
      }

      setScan(payload);
      setStatus(
        payload.totalFindings > 0
          ? `Scan complete. Found ${payload.totalFindings} exposed credentials across ${payload.flaggedMessages} emails.`
          : "Scan complete. No high-confidence secrets detected in this batch."
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Scan request failed.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card className="border-slate-800 bg-slate-950/70">
        <CardHeader>
          <CardTitle className="text-xl">Mailbox Scan</CardTitle>
          <CardDescription>
            Run a full body + attachment credential sweep on recent email history for <span className="text-slate-200">{mailbox}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="w-full sm:max-w-48">
              <label htmlFor="maxEmails" className="mb-1 block text-xs text-slate-400">
                Messages to scan
              </label>
              <Input
                id="maxEmails"
                type="number"
                min={10}
                max={500}
                value={maxEmails}
                onChange={(event) => setMaxEmails(event.target.value)}
              />
            </div>
            <Button className="sm:mt-5" disabled={running} onClick={startScan}>
              {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MailWarning className="mr-2 h-4 w-4" />}
              Start Deep Scan
            </Button>
          </div>

          {status ? (
            <p className="rounded-md border border-slate-800 bg-slate-900/70 p-3 text-sm text-slate-300">{status}</p>
          ) : null}
        </CardContent>
      </Card>

      {effectiveSummary ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-slate-800 bg-slate-950/70 md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  Risk score
                  <RiskLabel score={effectiveSummary.riskScore} />
                </CardTitle>
                <CardDescription>
                  Weighted by credential criticality and spread across threads.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-end justify-between">
                    <span className="text-3xl font-semibold text-slate-100">{effectiveSummary.riskScore}</span>
                    <span className="text-sm text-slate-400">out of 100</span>
                  </div>
                  <Progress value={effectiveSummary.riskScore} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-950/70">
              <CardHeader>
                <CardTitle className="text-base">Flagged emails</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-slate-100">{effectiveSummary.flaggedMessages}</div>
                <p className="text-sm text-slate-400">of {effectiveSummary.totalMessagesScanned} scanned</p>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-950/70">
              <CardHeader>
                <CardTitle className="text-base">Total findings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-3xl font-semibold text-slate-100">
                  {effectiveSummary.totalFindings}
                  {effectiveSummary.totalFindings === 0 ? <ShieldCheck className="h-5 w-5 text-emerald-400" /> : null}
                </div>
                <p className="text-sm text-slate-400">credential exposures</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-slate-800 bg-slate-950/70">
              <CardHeader>
                <CardTitle className="text-base">Severity Mix</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={severityData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      innerRadius={45}
                      paddingAngle={2}
                    >
                      {severityData.map((entry) => (
                        <Cell key={entry.name} fill={severityColors[entry.name] ?? "#2dd4bf"} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "0.5rem",
                        color: "#e2e8f0"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-950/70">
              <CardHeader>
                <CardTitle className="text-base">Top Exposed Secret Types</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={effectiveSummary.topTypes} margin={{ left: 8, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} interval={0} angle={-12} height={62} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "0.5rem",
                        color: "#e2e8f0"
                      }}
                    />
                    <Bar dataKey="count" fill="#2dd4bf" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {scan?.results?.length ? (
            <Card className="border-slate-800 bg-slate-950/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-4 w-4 text-rose-300" />
                  Flagged emails
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {scan.results.slice(0, 15).map((result) => (
                  <article key={result.messageId} className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h4 className="font-medium text-slate-100">{result.subject}</h4>
                        <p className="text-xs text-slate-400">{result.from}</p>
                        {result.date ? <p className="text-xs text-slate-500">{result.date}</p> : null}
                      </div>
                      <Badge variant="danger">{result.findings.length} findings</Badge>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">{result.snippet}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {result.findings.slice(0, 4).map((finding, index) => (
                        <Badge
                          key={`${result.messageId}-${finding.patternId}-${index}`}
                          variant={finding.severity === "critical" || finding.severity === "high" ? "danger" : "warning"}
                        >
                          {finding.patternName}
                        </Badge>
                      ))}
                    </div>
                  </article>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
