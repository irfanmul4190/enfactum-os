import { useMemo, useState } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine } from "recharts";
import { X } from "lucide-react";
import { formatNumber } from "@/data/invoiceData";
import { useInvoices } from "@/contexts/InvoiceContext";
import {
  MONTH_ORDER,
  QUARTERS,
  currentFY,
  invoicesInFY,
  monthlyTotals,
  quarterlyTotals,
  byAccount as aggByAccount,
  byLead as aggByLead,
  colorForAccount,
} from "@/lib/fiscalYear";

// FY target. Hardcoded for now — eventually should live in a `targets` table
// alongside historical FY actuals. Keep it as a constant here, not a per-app
// secret. (5,000,000 SGD was the FY25 goal; the constant can be edited
// freely when the target changes.)
const FY_TARGET = 5_000_000;
const AVG_MONTHLY_TARGET = Math.round(FY_TARGET / 12);
const QUARTERLY_TARGET = Math.round(FY_TARGET / 4);

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  color: "hsl(var(--foreground))",
  fontSize: "12px",
};

const EMPTY_MESSAGE = "No invoices yet — add data to populate this chart.";

function EmptyState({ title, hint = EMPTY_MESSAGE }: Readonly<{ title: string; hint?: string }>) {
  return (
    <div className="kpi-card">
      <div className="mb-4">
        <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>{title}</h3>
      </div>
      <p className="text-xs text-center py-12" style={{ color: "hsl(var(--muted-foreground))" }}>{hint}</p>
    </div>
  );
}

// ─── Monthly / Quarterly comparison ────────────────────────────────────────

function MoMDrillDown({
  month,
  fyInvoices,
  prevMonthTotal,
  onClose,
}: Readonly<{
  month: string;
  fyInvoices: ReturnType<typeof invoicesInFY>;
  prevMonthTotal: number;
  onClose: () => void;
}>) {
  const monthInvoices = fyInvoices.filter((i) => i.month.startsWith(month));
  const accountList = aggByAccount(monthInvoices);
  const leadList = aggByLead(monthInvoices);
  const accounts = accountList.map((a) => a.name);
  const total = monthInvoices.reduce((s, i) => s + i.totalBillingSGD, 0);
  const mom = prevMonthTotal > 0 ? ((total - prevMonthTotal) / prevMonthTotal) * 100 : null;

  return (
    <div className="mt-4 rounded-xl border p-4 animate-fade-in" style={{ background: "hsl(var(--surface-3))", borderColor: "hsl(var(--primary) / 0.3)" }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-bold" style={{ color: "hsl(var(--foreground))" }}>{month} — Account Breakdown</div>
          <div className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
            SGD {formatNumber(total)} total
            {mom !== null && (
              <span className="ml-2 font-semibold" style={{ color: mom >= 0 ? "hsl(var(--positive))" : "hsl(var(--negative))" }}>
                {mom >= 0 ? "▲" : "▼"} {Math.abs(mom).toFixed(1)}% vs prev month
              </span>
            )}
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary transition-colors" style={{ color: "hsl(var(--muted-foreground))" }}>
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>By Account</div>
          {accountList.length === 0
            ? <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>No invoice data</div>
            : accountList.map(({ name, value }) => {
                const color = colorForAccount(name, accounts);
                const pct = total > 0 ? (value / total) * 100 : 0;
                return (
                  <div key={name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: "hsl(var(--foreground))" }}>{name}</span>
                      <span className="mono font-semibold" style={{ color }}>
                        {pct.toFixed(1)}% · SGD {formatNumber(value)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--surface-4))" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
        </div>
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>By Account Lead</div>
          {leadList.length === 0
            ? <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>No invoice data</div>
            : leadList.map(({ name, value }) => (
                <div key={name} className="flex items-center justify-between rounded-lg px-2.5 py-1.5 border"
                  style={{ background: "hsl(var(--surface-2))", borderColor: "hsl(var(--border))" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))" }}>
                      {name[0]}
                    </div>
                    <span className="text-xs font-medium" style={{ color: "hsl(var(--foreground))" }}>{name}</span>
                  </div>
                  <div className="text-right">
                    <div className="mono text-xs font-bold" style={{ color: "hsl(var(--foreground))" }}>SGD {formatNumber(value)}</div>
                    <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{total > 0 ? ((value / total) * 100).toFixed(1) : 0}%</div>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipStyle} className="px-3 py-2 shadow-lg">
      <div className="font-semibold mb-1">{label}</div>
      <div className="text-xs mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>Click to drill down</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: "hsl(var(--muted-foreground))" }}>{p.name}:</span>
          <span className="font-medium mono">SGD {formatNumber(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export function MonthlyComparisonChart() {
  const { invoices } = useInvoices();
  const fy = currentFY();
  const [view, setView] = useState<"monthly" | "quarterly">("monthly");
  const [drillMonth, setDrillMonth] = useState<string | null>(null);
  const isQuarterly = view === "quarterly";

  const { fyInvoices, monthlyData, quarterlyData, hasAnyData } = useMemo(() => {
    const fyInvoices = invoicesInFY(invoices, fy);
    const m = monthlyTotals(fyInvoices);
    const q = quarterlyTotals(fyInvoices);
    return {
      fyInvoices,
      monthlyData: MONTH_ORDER.map((month) => ({ month, total: m[month] ?? 0 })),
      quarterlyData: QUARTERS.map((q2) => ({ quarter: q2.short, total: q[q2.short] ?? 0 })),
      hasAnyData: fyInvoices.length > 0,
    };
  }, [invoices, fy]);

  if (!hasAnyData) {
    return <EmptyState title={`Monthly Revenue — ${fy}`} />;
  }

  const handleBarClick = (data: any) => {
    if (isQuarterly) return;
    const month = data?.activePayload?.[0]?.payload?.month;
    if (!month) return;
    setDrillMonth((prev) => (prev === month ? null : month));
  };

  const prevMonthTotal = (() => {
    if (!drillMonth) return 0;
    const idx = MONTH_ORDER.indexOf(drillMonth as typeof MONTH_ORDER[number]);
    if (idx <= 0) return 0;
    return monthlyData[idx - 1].total;
  })();

  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            {isQuarterly ? `Quarterly Revenue — ${fy}` : `Monthly Revenue — ${fy}`}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
            {isQuarterly ? "SGD values · dashed line = quarterly target" : "Click any bar to see account & lead breakdown"}
          </p>
        </div>
        <div className="flex rounded-md overflow-hidden border text-xs shrink-0" style={{ borderColor: "hsl(var(--border))" }}>
          {(["monthly", "quarterly"] as const).map((v) => (
            <button key={v} onClick={() => { setView(v); setDrillMonth(null); }}
              className="px-2.5 py-1 capitalize transition-colors"
              style={{
                background: view === v ? "hsl(var(--primary))" : "hsl(var(--surface-2))",
                color: view === v ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
              }}>
              {v === "monthly" ? "Monthly" : "Quarterly"}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={isQuarterly ? quarterlyData : monthlyData} barGap={4} onClick={handleBarClick} style={{ cursor: isQuarterly ? "default" : "pointer" }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey={isQuarterly ? "quarter" : "month"} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v) => `${formatNumber(v)}`} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={isQuarterly ? QUARTERLY_TARGET : AVG_MONTHLY_TARGET}
            stroke="hsl(var(--warning))" strokeDasharray="5 3" strokeWidth={1.5}
            label={{ value: `Target SGD ${formatNumber(isQuarterly ? QUARTERLY_TARGET : AVG_MONTHLY_TARGET)}`, position: "insideTopRight", fontSize: 10, fill: "hsl(var(--warning))", dy: -6 }}
          />
          <Bar dataKey="total" radius={[3, 3, 0, 0]} maxBarSize={isQuarterly ? 64 : 32}>
            {(isQuarterly ? quarterlyData : monthlyData).map((entry: any) => (
              <Cell key={entry.month ?? entry.quarter}
                fill={!isQuarterly && drillMonth === entry.month ? "hsl(var(--primary))" : "hsl(var(--chart-1))"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: "hsl(var(--chart-1))" }} />
          <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{fy}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-px border-t-2 border-dashed" style={{ borderColor: "hsl(var(--warning))" }} />
          <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{isQuarterly ? "Quarterly target" : "Monthly target avg"}</span>
        </div>
        {!isQuarterly && <span className="text-xs ml-auto" style={{ color: "hsl(var(--muted-foreground))" }}>↑ Click bar for drill-down</span>}
      </div>
      {drillMonth && !isQuarterly && (
        <MoMDrillDown month={drillMonth} fyInvoices={fyInvoices} prevMonthTotal={prevMonthTotal} onClose={() => setDrillMonth(null)} />
      )}
    </div>
  );
}

// ─── Account breakdown ────────────────────────────────────────────────────

export function AccountBreakdownChart() {
  const { invoices } = useInvoices();
  const fy = currentFY();

  const data = useMemo(() => {
    const list = aggByAccount(invoicesInFY(invoices, fy));
    const accounts = list.map((a) => a.name);
    return list.map((d) => ({ ...d, color: colorForAccount(d.name, accounts) }));
  }, [invoices, fy]);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0) {
    return <EmptyState title="Revenue by Account" />;
  }

  return (
    <div className="kpi-card">
      <div className="mb-4">
        <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Revenue by Account — {fy} YTD</h3>
        <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>SGD equivalent including USD converted</p>
      </div>
      <div className="flex items-center gap-6">
        <ResponsiveContainer width="50%" height={180}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" strokeWidth={0}>
              {data.map((entry, index) => <Cell key={index} fill={entry.color} />)}
            </Pie>
            <Tooltip formatter={(v: number) => [`SGD ${formatNumber(v)}`, ""]} contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2">
          {data.map((d) => (
            <div key={d.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{d.name}</span>
              </div>
              <span className="text-xs font-medium mono" style={{ color: "hsl(var(--foreground))" }}>
                {total > 0 ? ((d.value / total) * 100).toFixed(1) : "0.0"}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Cumulative revenue vs target ─────────────────────────────────────────

export function CumulativeRevenueChart() {
  const { invoices } = useInvoices();
  const fy = currentFY();

  const { data, quarterEndValues, hasAnyData } = useMemo(() => {
    const fyInvoices = invoicesInFY(invoices, fy);
    const totals = monthlyTotals(fyInvoices);
    // FY shorthand. fy = "FY2026" → calendar years 26 (Apr-Dec) and 27 (Jan-Mar).
    const yy = parseInt(fy.slice(2), 10) % 100;
    const yyNext = (yy + 1) % 100;
    const pad = (n: number) => String(n).padStart(2, "0");
    const monthLabel = (m: string) => `${m}-${MONTH_ORDER.indexOf(m as typeof MONTH_ORDER[number]) <= 8 ? pad(yy) : pad(yyNext)}`;

    let cum = 0;
    const data = MONTH_ORDER.map((m) => {
      const v = totals[m] ?? 0;
      cum += v;
      return { month: monthLabel(m), cumulative: v > 0 ? cum : null, monthly: v };
    });

    const qEnds = QUARTERS.map((q) => monthLabel(q.months[q.months.length - 1]));
    const quarterEndValues = qEnds.map((m) => {
      const entry = data.find((d) => d.month === m);
      return entry?.cumulative ?? 0;
    });

    return { data, quarterEndValues, hasAnyData: fyInvoices.length > 0 };
  }, [invoices, fy]);

  if (!hasAnyData) {
    return <EmptyState title={`Cumulative Revenue vs Target — ${fy}`} />;
  }

  const qEndMonths = data
    .filter((_, i) => [2, 5, 8, 11].includes(i))
    .map((d) => d.month);
  const Q_LABELS = ["Q1", "Q2", "Q3", "Q4"];
  const Q_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

  return (
    <div className="kpi-card">
      <div className="mb-4">
        <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Cumulative Revenue vs Target — {fy}</h3>
        <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Running total toward SGD {formatNumber(FY_TARGET)} · quarterly milestones marked</p>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v) => `${formatNumber(v)}`} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={52} />
          <Tooltip formatter={(v: number, name: string) => [`SGD ${formatNumber(v)}`, name === "cumulative" ? "Cumulative" : "Monthly"]} contentStyle={tooltipStyle} />
          <ReferenceLine y={FY_TARGET} stroke="hsl(var(--warning))" strokeDasharray="6 3" strokeWidth={1.5}
            label={{ value: `Target S$${(FY_TARGET / 1_000_000).toFixed(1)}M`, position: "insideTopRight", fontSize: 10, fill: "hsl(var(--warning))", dy: -6 }} />
          {qEndMonths.map((m, i) => (
            <ReferenceLine key={m} x={m} stroke={Q_COLORS[i]} strokeDasharray="4 3" strokeWidth={1.5}
              label={{ value: `${Q_LABELS[i]} ${formatNumber(quarterEndValues[i])}`, position: "insideTopLeft", fontSize: 9, fill: Q_COLORS[i], dx: 4 }} />
          ))}
          <Area type="monotone" dataKey="cumulative" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#gradActual)" name="cumulative" />
        </AreaChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-4 gap-2 mt-3">
        {Q_LABELS.map((q, i) => (
          <div key={q} className="rounded-lg px-2 py-2 text-center border" style={{ background: "hsl(var(--surface-3))", borderColor: Q_COLORS[i] + "55" }}>
            <div className="text-xs font-semibold mb-0.5" style={{ color: Q_COLORS[i] }}>{q}</div>
            <div className="mono text-xs font-bold" style={{ color: "hsl(var(--foreground))" }}>SGD {formatNumber(quarterEndValues[i])}</div>
            <div className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
              {((quarterEndValues[i] / FY_TARGET) * 100).toFixed(0)}% of target
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Revenue by type ──────────────────────────────────────────────────────
// Invoice rows don't currently carry a `revenue_type` column. Until they do,
// this chart renders empty. Future: add `revenue_type` to invoices schema +
// AddInvoiceDialog select.

export function RevenueTypeChart() {
  return <EmptyState title="Revenue by Type" hint="Revenue type isn't captured on invoices yet — wire the field and this chart will populate." />;
}

// ─── Seasonality (FY-vs-FY comparison) ────────────────────────────────────
// Compares % share of annual revenue across months for the current FY and
// (when available) the previous FY. Both come from the same `invoices`
// source — no hardcoded estimates anymore.

export function SeasonalityChart() {
  const { invoices } = useInvoices();
  const fy = currentFY();
  const prevFY = `FY${parseInt(fy.slice(2), 10) - 1}`;

  const { data, hasAnyData } = useMemo(() => {
    const cur = invoicesInFY(invoices, fy);
    const prev = invoicesInFY(invoices, prevFY);
    const curMonths = monthlyTotals(cur);
    const prevMonths = monthlyTotals(prev);
    const curTotal = Object.values(curMonths).reduce((s, v) => s + v, 0);
    const prevTotal = Object.values(prevMonths).reduce((s, v) => s + v, 0);
    const data = MONTH_ORDER.map((m) => ({
      month: m,
      curPct: curTotal > 0 ? +((curMonths[m] ?? 0) / curTotal * 100).toFixed(1) : 0,
      prevPct: prevTotal > 0 ? +((prevMonths[m] ?? 0) / prevTotal * 100).toFixed(1) : 0,
      curVal: curMonths[m] ?? 0,
      prevVal: prevMonths[m] ?? 0,
    }));
    return { data, hasAnyData: cur.length > 0 || prev.length > 0 };
  }, [invoices, fy, prevFY]);

  if (!hasAnyData) {
    return <EmptyState title="Revenue Seasonality" />;
  }

  const evenShare = +(100 / 12).toFixed(1);

  return (
    <div className="kpi-card">
      <div className="mb-4">
        <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Revenue Seasonality — {prevFY} vs {fy}</h3>
        <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
          % share of annual revenue · dashed = even ({evenShare}%)
        </p>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} barGap={3} barSize={14}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v) => `${v}%`} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
          <Tooltip
            formatter={(v: number, name: string, props: any) => {
              const valKey = name === fy ? "curVal" : "prevVal";
              return [`${v}% · SGD ${formatNumber(props.payload[valKey] ?? 0)}`, name];
            }}
            contentStyle={tooltipStyle}
          />
          <ReferenceLine y={evenShare} stroke="hsl(var(--warning))" strokeDasharray="5 3" strokeWidth={1.5}
            label={{ value: `Even ${evenShare}%`, position: "insideTopRight", fontSize: 10, fill: "hsl(var(--warning))", dy: -6 }} />
          <Bar dataKey="prevPct" name={prevFY} fill="hsl(var(--positive))" opacity={0.6} radius={[3,3,0,0]} />
          <Bar dataKey="curPct"  name={fy}     fill="hsl(var(--chart-1))" radius={[3,3,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
