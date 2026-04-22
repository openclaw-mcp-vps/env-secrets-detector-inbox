"use client";

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
import type { ScanSummary } from "@/lib/types";

const COLORS = {
  critical: "#f85149",
  high: "#d29922",
  medium: "#58a6ff",
  low: "#3fb950"
} as const;

function asSeverityData(summary: ScanSummary) {
  return [
    { name: "Critical", value: summary.bySeverity.critical, key: "critical" },
    { name: "High", value: summary.bySeverity.high, key: "high" },
    { name: "Medium", value: summary.bySeverity.medium, key: "medium" },
    { name: "Low", value: summary.bySeverity.low, key: "low" }
  ].filter((item) => item.value > 0);
}

function asPatternData(summary: ScanSummary) {
  return Object.entries(summary.byPattern)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

export function SecurityReport({ summary }: { summary: ScanSummary }) {
  const severityData = asSeverityData(summary);
  const patternData = asPatternData(summary);

  return (
    <section className="rounded-2xl border border-[#263144] bg-[#101722] p-6">
      <h3 className="font-[var(--font-space-grotesk)] text-xl font-semibold text-[#f0f6fc]">Security Report</h3>
      <p className="mt-2 text-sm text-[#8b949e]">
        Prioritize fixes by severity first, then by recurring key type to remove systemic leaks.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-[#30363d] bg-[#0d1117] p-4">
          <p className="text-xs uppercase tracking-wide text-[#8b949e]">Findings</p>
          <p className="mt-2 text-2xl font-semibold text-[#f0f6fc]">{summary.totalFindings}</p>
        </div>
        <div className="rounded-lg border border-[#30363d] bg-[#0d1117] p-4">
          <p className="text-xs uppercase tracking-wide text-[#8b949e]">Unique secrets</p>
          <p className="mt-2 text-2xl font-semibold text-[#f0f6fc]">{summary.uniqueSecrets}</p>
        </div>
        <div className="rounded-lg border border-[#30363d] bg-[#0d1117] p-4">
          <p className="text-xs uppercase tracking-wide text-[#8b949e]">Risky messages</p>
          <p className="mt-2 text-2xl font-semibold text-[#f0f6fc]">{summary.riskyMessages}</p>
        </div>
        <div className="rounded-lg border border-[#30363d] bg-[#0d1117] p-4">
          <p className="text-xs uppercase tracking-wide text-[#8b949e]">Attachments scanned</p>
          <p className="mt-2 text-2xl font-semibold text-[#f0f6fc]">{summary.attachmentsScanned}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-[#30363d] bg-[#0d1117] p-4">
          <p className="mb-3 text-sm font-semibold text-[#f0f6fc]">Severity breakdown</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={severityData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95}>
                  {severityData.map((entry) => (
                    <Cell key={entry.key} fill={COLORS[entry.key as keyof typeof COLORS]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#0d1117", border: "1px solid #30363d", borderRadius: "8px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-[#30363d] bg-[#0d1117] p-4">
          <p className="mb-3 text-sm font-semibold text-[#f0f6fc]">Top leaked secret types</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={patternData} layout="vertical" margin={{ top: 4, right: 12, left: 12, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                <XAxis type="number" stroke="#8b949e" allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={140} stroke="#8b949e" />
                <Tooltip
                  contentStyle={{ background: "#0d1117", border: "1px solid #30363d", borderRadius: "8px" }}
                />
                <Bar dataKey="value" fill="#58a6ff" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
