import { Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from "recharts";
import { historicalRevenue, annualTargets, formatNumber, fy2025Monthly } from "@/data/invoiceData";

// FY2025 quarterly revenue (FY quarters: Q1=Apr-Jun, Q2=Jul-Sep, Q3=Oct-Dec, Q4=Jan-Mar)
const fy25Q = [
  fy2025Monthly.filter(m => ["Apr-25","May-25","Jun-25"].includes(m.label)).reduce((s, m) => s + m.totalSGD, 0),
  fy2025Monthly.filter(m => ["Jul-25","Aug-25","Sep-25"].includes(m.label)).reduce((s, m) => s + m.totalSGD, 0),
  fy2025Monthly.filter(m => ["Oct-25","Nov-25","Dec-25"].includes(m.label)).reduce((s, m) => s + m.totalSGD, 0),
  fy2025Monthly.filter(m => ["Jan-26","Feb-26","Mar-26"].includes(m.label)).reduce((s, m) => s + m.totalSGD, 0),
];
// FY2024 quarterly estimates were derived from a hardcoded FY24 total
// (3,929,098). Removed 2026-05-19 — that was real revenue data. Until FY24
// historicals are sourced from Supabase, the YoY columns will render blank.
const fy24Total = 0;
const fy24Weights = [0.22, 0.24, 0.27, 0.27];
const fy24Q = fy24Weights.map(w => Math.round(fy24Total * w));

const quarterlyData = ["Q1","Q2","Q3","Q4"].map((q, i) => {
  const fy25 = Math.round(fy25Q[i]);
  const fy24 = fy24Q[i];
  const yoy = fy24 > 0 ? +((fy25 - fy24) / fy24 * 100).toFixed(1) : null;
  const qoq = i > 0 && fy25Q[i - 1] > 0 ? +((fy25 - fy25Q[i - 1]) / fy25Q[i - 1] * 100).toFixed(1) : null;
  return { quarter: q, fy25, fy24, yoy, qoq };
});

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  color: "hsl(var(--foreground))",
  fontSize: "12px",
};

// Forward projections previously hardcoded the FY25 YTD figure (4,031,246)
// as the growth baseline. Removed 2026-05-19. Projection values should be
// driven by a `targets` table (or app settings) once that's wired.
const projections: { year: string; revenue: number; growth: number; projected: boolean }[] = [];

const yoyData = [
  ...historicalRevenue.map(h => ({ year: h.year, revenue: h.revenue, growth: h.growth, projected: false })),
  ...projections,
];

// Linear regression trend line — fit on historical data only, extend across all years
const histCount = historicalRevenue.length;
const xs = historicalRevenue.map((_, i) => i);
const ys = historicalRevenue.map(d => d.revenue);
const n = histCount;
const sumX = xs.reduce((a, b) => a + b, 0);
const sumY = ys.reduce((a, b) => a + b, 0);
const sumXY = xs.reduce((a, i) => a + i * ys[i], 0);
const sumX2 = xs.reduce((a, i) => a + i * i, 0);
const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
const intercept = (sumY - slope * sumX) / n;
const yoyDataWithTrend = yoyData.map((d, i) => ({
  ...d,
  trend: Math.round(intercept + slope * i),
}));

const fy25 = { target: 5000000, actual: 4031246 };
const fy26 = { target: 6500000, actual: 0 };
// FY2025 ends Mar 2026. Current month Feb 2026, so 1 month remains (Mar 2026)
const monthsRemaining = 1;
const requiredMonthly = (fy25.target - fy25.actual) / monthsRemaining;

export function TargetsGrowth() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--foreground))" }}>Targets & Growth</h1>
        <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>Historical performance, CAGR analysis and forward targets</p>
      </div>

      {/* Targets Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* FY25 */}
        <div className="kpi-card">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>FY2025 Target</h3>
              <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Apr 2025 – Mar 2026</p>
            </div>
            <span className="badge-positive text-xs">Active</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span style={{ color: "hsl(var(--muted-foreground))" }}>Target</span>
              <span className="mono font-bold" style={{ color: "hsl(var(--foreground))" }}>SGD 5,000,000</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "hsl(var(--muted-foreground))" }}>YTD Achieved</span>
              <span className="mono font-bold stat-positive">SGD {formatNumber(fy25.actual)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "hsl(var(--muted-foreground))" }}>Remaining</span>
              <span className="mono font-bold stat-warning">SGD {formatNumber(fy25.target - fy25.actual)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "hsl(var(--muted-foreground))" }}>Months Left</span>
              <span className="mono font-bold">{monthsRemaining}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "hsl(var(--muted-foreground))" }}>Required/Month</span>
              <span className="mono font-bold stat-negative">SGD {formatNumber(requiredMonthly)}</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden mt-2" style={{ background: "hsl(var(--surface-4))" }}>
              <div className="h-full rounded-full" style={{ width: `${(fy25.actual / fy25.target) * 100}%`, background: "var(--gradient-primary)" }} />
            </div>
            <div className="text-right text-sm font-semibold" style={{ color: "hsl(var(--primary))" }}>
              {((fy25.actual / fy25.target) * 100).toFixed(1)}% complete
            </div>
          </div>
        </div>

        {/* FY26 */}
        <div className="kpi-card">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>FY2026 Target</h3>
              <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Apr 2026 – Mar 2027</p>
            </div>
            <span className="badge-warning text-xs">Upcoming</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span style={{ color: "hsl(var(--muted-foreground))" }}>Target</span>
              <span className="mono font-bold" style={{ color: "hsl(var(--foreground))" }}>SGD 6,500,000</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "hsl(var(--muted-foreground))" }}>YoY Growth Required</span>
              <span className="mono font-bold stat-positive">+{((fy26.target / fy25.target - 1) * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "hsl(var(--muted-foreground))" }}>Monthly Run Rate Needed</span>
              <span className="mono font-bold" style={{ color: "hsl(var(--foreground))" }}>SGD {formatNumber(Math.round(fy26.target / 12))}</span>
            </div>
            <div className="mt-4 rounded-lg p-3" style={{ background: "hsl(var(--warning-muted))" }}>
              <p className="text-xs" style={{ color: "hsl(var(--warning))" }}>
                ⚡ To hit FY26 target, Enfactum needs to average SGD {formatNumber(Math.round(fy26.target / 12))}/month — a {((fy26.target / fy25.target - 1) * 100).toFixed(0)}% step-up from FY25's SGD 5M target.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Revenue Chart */}
      <div className="kpi-card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Historical & Projected Revenue — FY18 to FY28</h3>
            <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Annual actuals + 3-year projection · dashed = linear trend</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={yoyDataWithTrend} barSize={36}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="year" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => `${formatNumber(v)}`} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={56} />
            <Tooltip
              formatter={(v: number, name: string) => [
                `SGD ${formatNumber(v)}`,
                name === "trend" ? "Trend" : "Revenue",
              ]}
              contentStyle={tooltipStyle}
            />
            <Bar dataKey="revenue" radius={[4,4,0,0]}
              label={{ position: "top", formatter: (v: number) => `${formatNumber(v)}`, fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            >
              {yoyDataWithTrend.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.projected ? "hsl(var(--chart-2) / 0.45)" : "hsl(var(--chart-1))"}
                  stroke={entry.projected ? "hsl(var(--chart-2))" : "none"}
                  strokeWidth={entry.projected ? 1.5 : 0}
                  strokeDasharray={entry.projected ? "4 3" : "none"}
                />
              ))}
            </Bar>
            <Line
              type="linear"
              dataKey="trend"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              legendType="none"
            />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2">
          <div className="flex items-center gap-1.5"><div className="w-3 h-2 rounded-sm" style={{ background: "hsl(var(--chart-1))" }} /><span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Actuals</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-2 rounded-sm border" style={{ background: "hsl(var(--chart-2) / 0.45)", borderColor: "hsl(var(--chart-2))" }} /><span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Projected (FY26–FY28)</span></div>
          <div className="flex items-center gap-1.5"><div className="w-6 h-px border-t-2 border-dashed" style={{ borderColor: "hsl(var(--chart-2))" }} /><span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Trend</span></div>
        </div>
      </div>

      {/* Quarterly Growth */}
      <div className="kpi-card">
        <div className="mb-4">
          <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Quarterly Revenue — FY2025 YoY & QoQ Growth</h3>
          <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>FY quarters: Q1 Apr–Jun · Q2 Jul–Sep · Q3 Oct–Dec · Q4 Jan–Mar</p>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={quarterlyData} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="quarter" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tickFormatter={v => formatNumber(v)} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={56} />
            <YAxis yAxisId="right" orientation="right" tickFormatter={v => `${v}%`} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number, name: string) => {
                if (name === "FY2025") return [`SGD ${formatNumber(v)}`, "FY2025 Revenue"];
                if (name === "FY2024 est.") return [`SGD ${formatNumber(v)}`, "FY2024 Revenue (est.)"];
                if (name === "yoy") return [`${v.toFixed(1)}%`, "YoY Growth"];
                if (name === "qoq") return [`${v.toFixed(1)}%`, "QoQ Growth"];
                return [v, name];
              }}
            />
            <Bar yAxisId="left" dataKey="fy24" name="FY2024 est." fill="hsl(var(--positive))" radius={[4,4,0,0]} opacity={0.7} />
            <Bar yAxisId="left" dataKey="fy25" name="FY2025" fill="hsl(var(--chart-1))" radius={[4,4,0,0]} />
            <Line yAxisId="right" type="monotone" dataKey="yoy" name="yoy" stroke="hsl(var(--warning))" strokeWidth={2} dot={{ fill: "hsl(var(--warning))", r: 4 }}
              label={{ position: "top", formatter: (v: number) => v != null ? `${v.toFixed(0)}%` : "", fill: "hsl(var(--warning))", fontSize: 10 }}
            />
            <Line yAxisId="right" type="monotone" dataKey="qoq" name="qoq" stroke="hsl(var(--chart-2))" strokeWidth={2} strokeDasharray="4 3" dot={{ fill: "hsl(var(--chart-2))", r: 3 }}
              label={{ position: "bottom", formatter: (v: number) => v != null ? `${v.toFixed(0)}%` : "", fill: "hsl(var(--chart-2))", fontSize: 10 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-4 mt-3">
          <div className="flex items-center gap-1.5"><div className="w-3 h-2 rounded-sm opacity-70" style={{ background: "hsl(var(--positive))" }} /><span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>FY2024 (est.)</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-2 rounded-sm" style={{ background: "hsl(var(--chart-1))" }} /><span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>FY2025</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-1 rounded-full" style={{ background: "hsl(var(--warning))" }} /><span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>YoY Growth %</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-1 rounded-full" style={{ background: "hsl(var(--chart-2))" }} /><span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>QoQ Growth %</span></div>
        </div>
      </div>

      {/* Best in Class Suggestions */}
      <div className="rounded-xl border p-5" style={{ background: "hsl(var(--surface-3))", borderColor: "hsl(var(--border))" }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: "hsl(var(--foreground))" }}>🚀 Best-in-Class Process Improvements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: "Automated Invoice Numbering", desc: "Auto-increment ENF invoice numbers. Eliminate manual duplication risk.", icon: "🔢" },
            { title: "Payment Due Date Alerts", desc: "Flag invoices unpaid after 30/60/90 days. Send automatic reminders.", icon: "⏰" },
            { title: "Live FX Rate Integration", desc: "Pull live USD/SGD rates daily instead of hardcoded 1.3 conversion.", icon: "💱" },
            { title: "Digital Invoice Generation", desc: "Generate PDF invoices from entries. No more Word/email templates.", icon: "📄" },
            { title: "Approval Workflow", desc: "Account lead approval before invoices are sent. Full audit trail.", icon: "✅" },
            { title: "Revenue Forecasting", desc: "AI-powered projection based on historical run rates and pipeline.", icon: "📈" },
          ].map(item => (
            <div key={item.title} className="flex gap-3 p-3 rounded-lg" style={{ background: "hsl(var(--surface-2))" }}>
              <div className="text-xl">{item.icon}</div>
              <div>
                <div className="text-xs font-semibold mb-0.5" style={{ color: "hsl(var(--foreground))" }}>{item.title}</div>
                <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
