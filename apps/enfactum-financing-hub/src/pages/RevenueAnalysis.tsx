import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { fy2025Monthly, formatNumber } from "@/data/invoiceData";

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  color: "hsl(var(--foreground))",
  fontSize: "12px",
};

// All per-account FY24/FY25 totals were hardcoded here — biggest source of
// real-revenue leakage in the app. Removed 2026-05-19. Until wired to
// Supabase (via the accounts + invoices tables once invoices flow live),
// this page renders an empty state.
const ACCOUNTS: string[] = [];
const ACCOUNT_COLORS: Record<string, string> = {};

const accountComparisonData: { account: string; FY2024: number; FY2025: number }[] = [];
const fy24Total = 0;
const fy25Total = 0;

export function RevenueAnalysis() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--foreground))" }}>Revenue Analysis</h1>
        <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>Account-level and segment breakdowns — FY2024 vs FY2025</p>
      </div>

      {/* Account Comparison */}
      <div className="kpi-card">
        <div className="mb-4">
          <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Revenue by Account — FY2024 vs FY2025</h3>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={accountComparisonData} layout="vertical" barGap={3}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis type="number" tickFormatter={v => formatNumber(v)} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="account" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
            <Tooltip formatter={(v: number) => [`SGD ${formatNumber(v)}`]} contentStyle={tooltipStyle} />
            <Bar dataKey="FY2024" fill="hsl(var(--positive))" radius={[0,3,3,0]} maxBarSize={20} />
            <Bar dataKey="FY2025" fill="hsl(var(--chart-1))" radius={[0,3,3,0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2">
          <div className="flex items-center gap-1.5"><div className="w-3 h-2 rounded-sm" style={{ background: "hsl(var(--positive))" }} /><span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>FY2024</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-2 rounded-sm" style={{ background: "hsl(var(--chart-1))" }} /><span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>FY2025</span></div>
        </div>
      </div>

      {/* Account Detail Table */}
      <div className="kpi-card">
        <h3 className="text-sm font-semibold mb-4" style={{ color: "hsl(var(--foreground))" }}>Account Performance Detail</h3>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Account</th>
                <th>FY2024 Revenue</th>
                <th>FY2024 %</th>
                <th>FY2025 Revenue</th>
                <th>FY2025 %</th>
                <th>YoY Change</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {accountComparisonData.map(acc => {
                const yoy = acc.FY2024 > 0 ? ((acc.FY2025 - acc.FY2024) / acc.FY2024) * 100 : null;
                const pct24 = ((acc.FY2024 / fy24Total) * 100);
                const pct25 = ((acc.FY2025 / fy25Total) * 100);
                return (
                  <tr key={acc.account}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: ACCOUNT_COLORS[acc.account] }} />
                        <span className="font-medium text-sm" style={{ color: "hsl(var(--foreground))" }}>{acc.account}</span>
                      </div>
                    </td>
                    <td><span className="mono text-sm">SGD {formatNumber(acc.FY2024)}</span></td>
                    <td><span className="mono text-sm">{acc.FY2024 > 0 ? pct24.toFixed(1) : "—"}%</span></td>
                    <td><span className="mono text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>SGD {formatNumber(acc.FY2025)}</span></td>
                    <td><span className="mono text-sm">{acc.FY2025 > 0 ? pct25.toFixed(1) : "—"}%</span></td>
                    <td>
                      {yoy !== null ? (
                        <span className={yoy >= 0 ? "badge-positive" : "badge-negative"}>
                          {yoy >= 0 ? "+" : ""}{yoy.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="badge-positive">NEW</span>
                      )}
                    </td>
                    <td>
                      <div className="w-24 h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--surface-4))" }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct25 * 2.5, 100)}%`, background: ACCOUNT_COLORS[acc.account] }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Key Insights placeholder — previously rendered hardcoded narrative
          like "Top Account: HP — SGD 1.43M". Replace with computed insights
          once accountComparisonData is fed from real data. */}
      {accountComparisonData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* TODO: compute Top Account / Fastest Growing / Lost Account from
              accountComparisonData and render here. */}
        </div>
      )}
    </div>
  );
}
