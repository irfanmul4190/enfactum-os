import { useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ComposedChart, Area, AreaChart, ReferenceLine,
} from "recharts";
import { formatNumber } from "@/data/invoiceData";
import { useInvoices } from "@/contexts/InvoiceContext";

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  color: "hsl(var(--foreground))",
  fontSize: "12px",
};

const MONTH_ORDER = ["Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"];
const LEAD_COLORS: Record<string, string> = {
  Pooja:    "hsl(var(--chart-1))",
  Sandeep:  "hsl(var(--chart-2))",
  William:  "hsl(var(--chart-3))",
  "Sanjay C": "hsl(var(--chart-4))",
  Irfan:    "hsl(210 60% 65%)",
  Eve:      "hsl(var(--muted-foreground))",
};
const LEADS = ["Pooja","Sandeep","William","Sanjay C","Irfan","Eve"];

const GEO_KEYS = ["Singapore","Malaysia","India","Indonesia","Others"];
const GEO_COLORS = ["hsl(var(--chart-1))","hsl(var(--chart-2))","hsl(var(--chart-3))","hsl(var(--chart-4))","hsl(var(--muted-foreground))"];

const TYPE_KEYS = ["Consulting","Marketing Services","Impact","Manpower","Pass-Thru"];
const TYPE_COLORS_ARR = [
  "hsl(var(--chart-1))","hsl(var(--chart-2))","hsl(var(--chart-3))",
  "hsl(var(--chart-4))","hsl(var(--muted-foreground))",
];
const QUARTER_MONTHS_MAP = [
  { q: "Q1", months: ["Apr","May","Jun"] },
  { q: "Q2", months: ["Jul","Aug","Sep"] },
  { q: "Q3", months: ["Oct","Nov","Dec"] },
  { q: "Q4", months: ["Jan","Feb","Mar"] },
];

type ChartRow = Record<string, number | string>;

const SectionHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="mb-4">
    <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>{title}</h3>
    <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{subtitle}</p>
  </div>
);

export function Analytics() {
  const { invoices } = useInvoices();

  const allFY25 = useMemo(
    () => invoices.filter(i => i.fiscalYear === "FY2025"),
    [invoices],
  );

  // 1. Account Lead Monthly Trend
  const leadMonthlyData = useMemo<ChartRow[]>(() => MONTH_ORDER.map(m => {
    const row: ChartRow = { month: m };
    LEADS.forEach(lead => {
      row[lead] = allFY25
        .filter(inv => inv.month.split("-")[0] === m && inv.accountLead === lead)
        .reduce((s, inv) => s + inv.totalBillingSGD, 0);
    });
    return row;
  }), [allFY25]);

  // 2. Client Concentration / Pareto
  const paretoData = useMemo(() => {
    const clientTotals: Record<string, number> = {};
    allFY25.forEach(inv => {
      clientTotals[inv.account] = (clientTotals[inv.account] ?? 0) + inv.totalBillingSGD;
    });
    const total = Object.values(clientTotals).reduce((s, v) => s + v, 0);
    let cumPct = 0;
    return Object.entries(clientTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => {
        cumPct += total > 0 ? (value / total) * 100 : 0;
        return { name, value: Math.round(value), cumPct: +cumPct.toFixed(1) };
      });
  }, [allFY25]);

  // 3. Geography Stacked Area
  const geoMonthly = useMemo<ChartRow[]>(() => MONTH_ORDER.map(m => {
    const invs = allFY25.filter(inv => inv.month.split("-")[0] === m);
    const row: ChartRow = { month: m };
    GEO_KEYS.forEach(g => { row[g] = 0; });
    invs.forEach(inv => {
      const geo = GEO_KEYS.includes(inv.country ?? "") ? (inv.country as string) : "Others";
      row[geo] = (row[geo] as number) + inv.totalBillingSGD;
    });
    return row;
  }), [allFY25]);

  // 4. Currency Mix
  const currencyMonthly = useMemo(() => MONTH_ORDER.map(m => {
    const invs = allFY25.filter(inv => inv.month.split("-")[0] === m);
    const sgd = invs.filter(i => i.currency === "SGD").reduce((s, i) => s + i.totalBillingSGD, 0);
    const usd = invs.filter(i => i.currency === "USD").reduce((s, i) => s + i.totalBillingSGD, 0);
    const tot = sgd + usd;
    return {
      month: m,
      SGD: Math.round(sgd), USD: Math.round(usd),
      SGDPct: tot > 0 ? +((sgd / tot) * 100).toFixed(1) : 0,
      USDPct: tot > 0 ? +((usd / tot) * 100).toFixed(1) : 0,
    };
  }), [allFY25]);

  // 5. Revenue Type Mix by Quarter — % of each quarter's revenue per type.
  const typeMixData = useMemo<ChartRow[]>(() => QUARTER_MONTHS_MAP.map(({ q, months }) => {
    const invs = allFY25.filter(inv => months.includes(inv.month.split("-")[0]));
    const byType: Record<string, number> = {};
    TYPE_KEYS.forEach(t => { byType[t] = 0; });
    invs.forEach(inv => {
      const t = inv.revenueType ?? "";
      if (TYPE_KEYS.includes(t)) byType[t] += inv.totalBillingSGD;
    });
    const total = Object.values(byType).reduce((s, v) => s + v, 0);
    const row: ChartRow = { quarter: q, total: Math.round(total) };
    TYPE_KEYS.forEach(t => { row[t] = total > 0 ? +((byType[t] / total) * 100).toFixed(1) : 0; });
    return row;
  }), [allFY25]);

  // 6. Lead Revenue Share by Quarter
  const leadQData = useMemo<ChartRow[]>(() => QUARTER_MONTHS_MAP.map(({ q, months }) => {
    const invs = allFY25.filter(inv => months.includes(inv.month.split("-")[0]));
    const row: ChartRow = { quarter: q };
    LEADS.forEach(l => { row[l] = 0; });
    invs.forEach(inv => {
      if (LEADS.includes(inv.accountLead)) {
        row[inv.accountLead] = (row[inv.accountLead] as number) + inv.totalBillingSGD;
      }
    });
    return row;
  }), [allFY25]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--foreground))" }}>Analytics</h1>
        <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
          Deep-dive charts across leads, clients, geography, currency and revenue mix — FY2025
        </p>
      </div>

      {/* Row 1: Lead Trend + Pareto */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* 1. Account Lead Monthly Trend */}
        <div className="kpi-card">
          <SectionHeader title="Account Lead Revenue — Monthly Trend" subtitle="Individual contribution per lead across FY2025" />
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={leadMonthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => formatNumber(v)} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={52} />
              <Tooltip formatter={(v: number, name: string) => [`SGD ${formatNumber(v)}`, name]} contentStyle={tooltipStyle} />
              {LEADS.map(lead => (
                <Line key={lead} type="monotone" dataKey={lead} stroke={LEAD_COLORS[lead]} strokeWidth={2}
                  dot={{ r: 2, fill: LEAD_COLORS[lead] }} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2">
            {LEADS.map(l => (
              <div key={l} className="flex items-center gap-1.5">
                <div className="w-3 h-1.5 rounded-full" style={{ background: LEAD_COLORS[l] }} />
                <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Client Concentration Pareto */}
        <div className="kpi-card">
          <SectionHeader title="Client Concentration — Pareto" subtitle="Top clients by revenue · cumulative % line (80/20 rule)" />
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={paretoData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={40} />
              <YAxis yAxisId="left" tickFormatter={v => formatNumber(v)} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={52} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={v => `${v}%`} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={40} domain={[0, 100]} />
              <Tooltip formatter={(v: number, name: string) => [
                name === "cumPct" ? `${v}%` : `SGD ${formatNumber(v)}`,
                name === "cumPct" ? "Cumulative %" : "Revenue",
              ]} contentStyle={tooltipStyle} />
              <ReferenceLine yAxisId="right" y={80} stroke="hsl(var(--warning))" strokeDasharray="5 3" strokeWidth={1.5}
                label={{ value: "80%", position: "insideTopRight", fontSize: 10, fill: "hsl(var(--warning))" }} />
              <Bar yAxisId="left" dataKey="value" fill="hsl(var(--chart-1))" radius={[3,3,0,0]} maxBarSize={32} />
              <Line yAxisId="right" type="monotone" dataKey="cumPct" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 3, fill: "hsl(var(--chart-2))" }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Geography Area + Currency Mix */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* 3. Revenue by Geography — Stacked Area */}
        <div className="kpi-card">
          <SectionHeader title="Revenue by Geography — Monthly Stacked" subtitle="Singapore, Malaysia, India, Indonesia & Others across FY2025" />
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={geoMonthly}>
              <defs>
                {GEO_KEYS.map((g, i) => (
                  <linearGradient key={g} id={`geoGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={GEO_COLORS[i]} stopOpacity={0.6} />
                    <stop offset="95%" stopColor={GEO_COLORS[i]} stopOpacity={0.1} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => formatNumber(v)} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={52} />
              <Tooltip formatter={(v: number, name: string) => [`SGD ${formatNumber(v)}`, name]} contentStyle={tooltipStyle} />
              {GEO_KEYS.map((g, i) => (
                <Area key={g} type="monotone" dataKey={g} stackId="geo"
                  stroke={GEO_COLORS[i]} fill={`url(#geoGrad${i})`} strokeWidth={1.5} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2">
            {GEO_KEYS.map((g, i) => (
              <div key={g} className="flex items-center gap-1.5">
                <div className="w-3 h-2 rounded-sm" style={{ background: GEO_COLORS[i] }} />
                <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{g}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. SGD vs USD Currency Mix */}
        <div className="kpi-card">
          <SectionHeader title="SGD vs USD Invoice Mix — Monthly" subtitle="Revenue in SGD (local) vs USD (converted) by month" />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={currencyMonthly} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => formatNumber(v)} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={52} />
              <Tooltip formatter={(v: number, name: string) => [`SGD ${formatNumber(v)}`, name]} contentStyle={tooltipStyle} />
              <Bar dataKey="SGD" fill="hsl(var(--chart-1))" radius={[3,3,0,0]} stackId="cur" />
              <Bar dataKey="USD" fill="hsl(var(--chart-3))" radius={[3,3,0,0]} stackId="cur" />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5"><div className="w-3 h-2 rounded-sm" style={{ background: "hsl(var(--chart-1))" }} /><span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>SGD invoices</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-2 rounded-sm" style={{ background: "hsl(var(--chart-3))" }} /><span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>USD invoices (converted)</span></div>
          </div>
        </div>
      </div>

      {/* Row 3: Revenue Type Mix + Lead Share by Quarter */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* 5. Revenue Type Mix by Quarter — 100% stacked */}
        <div className="kpi-card">
          <SectionHeader title="Revenue Type Mix — % by Quarter" subtitle="How Consulting, Manpower, Marketing & others shift each quarter" />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={typeMixData} barSize={56}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="quarter" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `${v}%`} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={40} domain={[0, 100]} />
              <Tooltip formatter={(v: number, name: string) => [`${v}%`, name]} contentStyle={tooltipStyle} />
              {TYPE_KEYS.map((t, i) => (
                <Bar key={t} dataKey={t} fill={TYPE_COLORS_ARR[i]} stackId="type" radius={i === TYPE_KEYS.length - 1 ? [3,3,0,0] : [0,0,0,0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2">
            {TYPE_KEYS.map((t, i) => (
              <div key={t} className="flex items-center gap-1.5">
                <div className="w-3 h-2 rounded-sm" style={{ background: TYPE_COLORS_ARR[i] }} />
                <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Lead Revenue Share by Quarter */}
        <div className="kpi-card">
          <SectionHeader title="Account Lead Share — by Quarter" subtitle="Who drove revenue each quarter across FY2025" />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={leadQData} barSize={56}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="quarter" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => formatNumber(v)} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={52} />
              <Tooltip formatter={(v: number, name: string) => [`SGD ${formatNumber(v)}`, name]} contentStyle={tooltipStyle} />
              {LEADS.map(lead => (
                <Bar key={lead} dataKey={lead} fill={LEAD_COLORS[lead]} stackId="lead" />
              ))}
            </BarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2">
            {LEADS.map(l => (
              <div key={l} className="flex items-center gap-1.5">
                <div className="w-3 h-2 rounded-sm" style={{ background: LEAD_COLORS[l] }} />
                <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
