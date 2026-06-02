import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { fetchContractsList } from "@/lib/contracts";
import { TopBar } from "@/components/TopBar";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from "recharts";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  FileText, Clock, AlertTriangle, TrendingUp, Send, Plus,
  ArrowRight, User, Download,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { STATUS_PIPELINE } from "@/lib/types";
import { fmtSGD, fmtSGDCompact, fmtDate, timeAgo, daysRemaining } from "@/lib/format";
import type { ContractView, ContractEvent } from "@/lib/types";

// ─── Demo data ───────────────────────────────────────────────
const demoBase = {
  renewal_date: null, account_id: null, deal_id: null, owner_id: null,
  scope_summary: null, deliverables: null, payment_terms: null,
  client_signer_name: null, client_signer_email: null, enfactum_signer_id: null,
  internal_notes: null, file_url: null, signed_file_url: null, signed_at: null,
};

const DEMO_CONTRACTS: ContractView[] = [
  { ...demoBase, id: "1", title: "Master Services Agreement — Acme Corp", type: "MSA", status: "active", value: 500000, currency: "SGD", start_date: "2025-01-01", end_date: "2025-04-15", auto_renew: true, account_name: "Acme Corp", deal_title: "Acme Digital Transformation", owner_name: "Rahul Sharma", created_at: "2025-01-01" },
  { ...demoBase, id: "2", title: "SOW — Mobile App Development", type: "SOW", status: "draft", value: 120000, currency: "SGD", start_date: "2025-03-01", end_date: "2025-09-30", auto_renew: false, account_name: "TechStart Inc", deal_title: "TechStart Mobile Project", owner_name: "Priya Patel", created_at: "2025-02-15" },
  { ...demoBase, id: "3", title: "NDA — Globex Partnership", type: "NDA", status: "signed", value: null, currency: null, start_date: "2025-02-01", end_date: "2026-02-01", auto_renew: false, account_name: "Globex Corporation", deal_title: null, owner_name: "Rahul Sharma", created_at: "2025-02-01" },
  { ...demoBase, id: "4", title: "SOW — Data Platform Build", type: "SOW", status: "internal_review", value: 350000, currency: "SGD", start_date: null, end_date: null, auto_renew: false, account_name: "FinServ Ltd", deal_title: "FinServ Data Platform", owner_name: "Demo User", created_at: "2025-03-10" },
  { ...demoBase, id: "5", title: "MSA — Retired Client Agreement", type: "MSA", status: "expired", value: 200000, currency: "SGD", start_date: "2023-01-01", end_date: "2024-12-31", auto_renew: false, account_name: "OldTech Solutions", deal_title: null, owner_name: "Priya Patel", created_at: "2023-01-01" },
  { ...demoBase, id: "6", title: "SOW — Cloud Migration", type: "SOW", status: "sent_to_client", value: 420000, currency: "SGD", start_date: null, end_date: null, auto_renew: false, account_name: "CloudFirst Ltd", deal_title: "CloudFirst Migration", owner_name: "Rahul Sharma", created_at: "2025-03-15" },
  { ...demoBase, id: "7", title: "MSA — BankCo Agreement", type: "MSA", status: "active", value: 800000, currency: "SGD", start_date: "2025-01-15", end_date: "2025-04-20", auto_renew: true, account_name: "BankCo", deal_title: "BankCo Digital", owner_name: "Priya Patel", created_at: "2025-01-15" },
];

const DEMO_EVENTS: ContractEvent[] = [
  { id: "e1", module: "enforge", entity_type: "contract", entity_id: "1", event_type: "contract.status_changed", payload: { from: "signed", to: "active" }, actor_id: "e1", actor_name: "Rahul Sharma", created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: "e2", module: "enforge", entity_type: "contract", entity_id: "6", event_type: "contract.created", payload: { title: "SOW — Cloud Migration", type: "SOW" }, actor_id: "e2", actor_name: "Priya Patel", created_at: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: "e3", module: "enforge", entity_type: "contract", entity_id: "4", event_type: "contract.status_changed", payload: { from: "draft", to: "internal_review" }, actor_id: "e1", actor_name: "Rahul Sharma", created_at: new Date(Date.now() - 24 * 3600000).toISOString() },
  { id: "e4", module: "enforge", entity_type: "contract", entity_id: "2", event_type: "contract.created", payload: { title: "SOW — Mobile App Development", type: "SOW" }, actor_id: "e2", actor_name: "Priya Patel", created_at: new Date(Date.now() - 48 * 3600000).toISOString() },
  { id: "e5", module: "enforge", entity_type: "contract", entity_id: "3", event_type: "contract.status_changed", payload: { from: "approved", to: "signed" }, actor_id: "e1", actor_name: "Rahul Sharma", created_at: new Date(Date.now() - 72 * 3600000).toISOString() },
];

// ─── Helpers ─────────────────────────────────────────────────
function eventDescription(evt: ContractEvent): string {
  const p = evt.payload ?? {};
  switch (evt.event_type) {
    case "contract.created":
      return `Created "${p.title || "a contract"}"`;
    case "contract.status_changed":
      return `Moved contract from ${humanStatus(p.from)} → ${humanStatus(p.to)}`;
    case "contract.updated":
      return "Updated contract details";
    case "contract.deleted":
      return "Deleted a contract";
    case "contract.duplicated":
      return "Duplicated a contract";
    default:
      return evt.event_type;
  }
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft", internal_review: "Internal Review", sent_to_client: "Sent to Client",
  client_review: "Client Review", negotiation: "Negotiation", approved: "Approved",
  signed: "Signed", active: "Active", expired: "Expired",
};
function humanStatus(s: string) { return STATUS_LABEL[s] || s; }

const PIPELINE_COLORS: Record<string, string> = {
  draft: "bg-muted",
  internal_review: "bg-warning/20",
  sent_to_client: "bg-primary/20",
  client_review: "bg-primary/20",
  negotiation: "bg-warning/20",
  approved: "bg-success/20",
  signed: "bg-success/20",
  active: "bg-success/20",
};
const PIPELINE_TEXT: Record<string, string> = {
  draft: "text-muted-foreground",
  internal_review: "text-warning",
  sent_to_client: "text-primary",
  client_review: "text-primary",
  negotiation: "text-warning",
  approved: "text-success",
  signed: "text-success",
  active: "text-success",
};

// ─── Component ───────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: contracts = [], isLoading } = useQuery<ContractView[]>({
    queryKey: ["contracts"],
    queryFn: async () => {
      if (!isSupabaseConfigured) return DEMO_CONTRACTS;
      return fetchContractsList();
    },
  });

  const { data: events = [] } = useQuery<ContractEvent[]>({
    queryKey: ["dashboard-events"],
    queryFn: async () => {
      if (!isSupabaseConfigured) return DEMO_EVENTS;
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("module", "enforge")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as unknown as ContractEvent[];
    },
  });

  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 86400000);
  const in60 = new Date(now.getTime() + 60 * 86400000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

  // KPIs
  const activeContracts = contracts.filter(c => c.status === "active" || c.status === "signed");
  const totalValue = activeContracts.reduce((s, c) => s + (c.value ?? 0), 0);
  const pendingSig = contracts.filter(c => c.status === "sent_to_client" || c.status === "client_review").length;
  const expiringSoon = contracts.filter(c => c.status === "active" && c.end_date && new Date(c.end_date) >= now && new Date(c.end_date) <= in30);
  const needingAttention = contracts.filter(c =>
    (c.status === "draft" || c.status === "internal_review") &&
    new Date(c.created_at) <= sevenDaysAgo
  ).length;

  // Pipeline counts
  const allStatuses = [...STATUS_PIPELINE.map(s => s.key), "expired" as const];
  const pipelineCounts = allStatuses.map(key => {
    const inStage = contracts.filter(c => c.status === key);
    return {
      key,
      label: STATUS_LABEL[key] || key,
      count: inStage.length,
      value: inStage.reduce((s, c) => s + (c.value ?? 0), 0),
    };
  });

  // Chart: Contracts by type
  const typeMap = new Map<string, number>();
  contracts.forEach(c => typeMap.set(c.type, (typeMap.get(c.type) ?? 0) + 1));
  const typeChartData = Array.from(typeMap.entries()).map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  const TYPE_COLORS = ["hsl(212,100%,67%)", "hsl(142,71%,45%)", "hsl(38,92%,50%)", "hsl(0,72%,51%)", "hsl(262,83%,58%)", "hsl(180,60%,45%)"];

  // Chart: Value by status (donut)
  const statusValueData = pipelineCounts
    .filter(s => s.value > 0)
    .map(s => ({ name: s.label, value: s.value }));
  const DONUT_COLORS: Record<string, string> = {
    "Draft": "hsl(215,14%,50%)",
    "Internal Review": "hsl(38,92%,50%)",
    "Sent to Client": "hsl(212,100%,67%)",
    "Client Review": "hsl(212,100%,55%)",
    "Negotiation": "hsl(38,80%,55%)",
    "Approved": "hsl(142,71%,45%)",
    "Signed": "hsl(142,60%,55%)",
    "Active": "hsl(142,71%,35%)",
    "Expired": "hsl(0,72%,51%)",
  };

  // Expiring within 60 days
  const expiringContracts = contracts
    .filter(c => c.status === "active" && c.end_date && new Date(c.end_date) >= now && new Date(c.end_date) <= in60)
    .sort((a, b) => new Date(a.end_date!).getTime() - new Date(b.end_date!).getTime());

  const SkeletonBox = ({ className }: { className?: string }) => (
    <div className={cn("animate-pulse rounded bg-muted", className)} />
  );

  return (
    <>
      <TopBar title="Dashboard" />
      <main className="flex-1 p-4 sm:p-6 space-y-6 overflow-auto">
        {/* ── Header with Export ── */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Overview</h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                const lines = [
                  "en·Forge Dashboard Summary",
                  `Exported: ${fmtDate(new Date().toISOString())}`,
                  "",
                  "KPI,Value",
                  `Active Contracts,${activeContracts.length}`,
                  `Total Contract Value,"${fmtSGD(totalValue)}"`,
                  `Pending Signatures,${pendingSig}`,
                  `Expiring Soon (30d),${expiringSoon.length}`,
                  `Contracts Needing Attention,${needingAttention}`,
                  "",
                  "Pipeline Stage,Count,Value",
                  ...pipelineCounts.map(s => `${s.label},${s.count},"${fmtSGD(s.value)}"`),
                  "",
                  "Expiring Contracts (60d)",
                  "Title,Account,End Date,Days Remaining,Value",
                  ...expiringContracts.map(c => `"${c.title}","${c.account_name ?? ""}",${c.end_date},${daysRemaining(c.end_date!)},"${c.value != null ? fmtSGD(c.value) : ""}"`)
                ];
                const csv = lines.join("\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `dashboard_${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
                toast({ title: "Dashboard exported as CSV" });
              }}>Export as CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const win = window.open("", "_blank");
                if (!win) { toast({ title: "Popup blocked", variant: "destructive" }); return; }
                win.document.write(`<!DOCTYPE html><html><head><title>Dashboard Export</title><style>
                  body{font-family:system-ui,sans-serif;padding:40px;color:#1a1a2e}
                  h1{font-size:20px;margin-bottom:4px} .sub{color:#666;font-size:12px;margin-bottom:24px}
                  h2{font-size:15px;margin:24px 0 8px;border-bottom:1px solid #ddd;padding-bottom:4px}
                  table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:16px}
                  th{background:#f0f0f5;text-align:left;padding:8px 10px;border-bottom:2px solid #ddd;font-weight:600}
                  td{padding:7px 10px;border-bottom:1px solid #eee}
                  tr:nth-child(even){background:#fafafa}
                  .kpi{display:inline-block;border:1px solid #e0e0e0;border-radius:8px;padding:12px 20px;margin:4px 8px 4px 0;text-align:center}
                  .kpi .val{font-size:22px;font-weight:700} .kpi .lbl{font-size:11px;color:#666;margin-top:2px}
                  @media print{body{padding:20px} button{display:none}}
                </style></head><body>
                  <h1>en·Forge — Dashboard Report</h1>
                  <p class="sub">Exported ${fmtDate(new Date().toISOString())}</p>
                  <div>
                    ${[
                      { l: "Active Contracts", v: activeContracts.length },
                      { l: "Total Value", v: fmtSGD(totalValue) },
                      { l: "Pending Signatures", v: pendingSig },
                      { l: "Expiring Soon", v: expiringSoon.length },
                    ].map(k => `<div class="kpi"><div class="val">${k.v}</div><div class="lbl">${k.l}</div></div>`).join("")}
                  </div>
                  <h2>Pipeline</h2>
                  <table><thead><tr><th>Stage</th><th>Count</th><th style="text-align:right">Value</th></tr></thead><tbody>
                    ${pipelineCounts.map(s => `<tr><td>${s.label}</td><td>${s.count}</td><td style="text-align:right">${fmtSGD(s.value)}</td></tr>`).join("")}
                  </tbody></table>
                  ${expiringContracts.length > 0 ? `<h2>Expiring Contracts (60 days)</h2>
                  <table><thead><tr><th>Title</th><th>Account</th><th>End Date</th><th>Days Left</th><th style="text-align:right">Value</th></tr></thead><tbody>
                    ${expiringContracts.map(c => `<tr><td>${c.title}</td><td>${c.account_name ?? "—"}</td><td>${fmtDate(c.end_date)}</td><td>${daysRemaining(c.end_date!)}</td><td style="text-align:right">${c.value != null ? fmtSGD(c.value) : "—"}</td></tr>`).join("")}
                  </tbody></table>` : ""}
                  <br><button onclick="window.print()" style="padding:8px 20px;background:#3b82f6;color:white;border:none;border-radius:6px;cursor:pointer;font-size:13px">Print / Save as PDF</button>
                </body></html>`);
                win.document.close();
                toast({ title: "PDF ready", description: "Use Print → Save as PDF in the new tab." });
              }}>Export as PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Active Contracts", value: activeContracts.length, icon: FileText, color: "text-success" },
            { label: "Total Contract Value", value: fmtSGD(totalValue), icon: TrendingUp, color: "text-primary" },
            { label: "Pending Signatures", value: pendingSig, icon: Send, color: "text-warning" },
            { label: "Expiring Soon", value: expiringSoon.length, icon: AlertTriangle, color: expiringSoon.length > 0 ? "text-destructive" : "text-muted-foreground" },
          ].map(kpi => (
            <Card key={kpi.label} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
                <kpi.icon className={cn("h-4 w-4 sm:h-5 sm:w-5", kpi.color)} />
              </CardHeader>
              <CardContent>
                {isLoading ? <SkeletonBox className="h-8 w-20" /> : (
                  <div className="text-xl sm:text-2xl font-bold tabular-nums">{kpi.value}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Contract Pipeline ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contract Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <SkeletonBox className="h-24 w-full" /> : (
              <div className="overflow-x-auto">
                <div className="flex gap-2 min-w-[700px]">
                  {pipelineCounts.map((stage, i) => (
                    <div key={stage.key} className="flex items-center flex-1">
                      <div
                        className={cn(
                          "flex-1 rounded-lg p-3 text-center transition-all hover:scale-[1.02]",
                          PIPELINE_COLORS[stage.key] ?? "bg-destructive/15",
                        )}
                      >
                        <div className={cn("text-2xl font-bold", PIPELINE_TEXT[stage.key] ?? "text-destructive")}>
                          {stage.count}
                        </div>
                        <div className="text-[10px] font-medium text-muted-foreground leading-tight mt-1">
                          {stage.label}
                        </div>
                        {stage.value > 0 && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {fmtSGDCompact(stage.value)}
                          </div>
                        )}
                      </div>
                      {i < pipelineCounts.length - 1 && (
                        <ArrowRight className="h-3 w-3 text-muted-foreground/40 mx-0.5 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Charts Row ── */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Bar Chart: Contracts by Type */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contracts by Type</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <SkeletonBox className="h-52 w-full" /> : typeChartData.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={typeChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fill: "hsl(215,14%,50%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(215,14%,50%)", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(216,22%,10%)", border: "1px solid hsl(216,18%,16%)", borderRadius: 8, color: "hsl(210,17%,90%)" }}
                      cursor={{ fill: "hsl(216,18%,14%)", opacity: 0.5 }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                      {typeChartData.map((_, i) => (
                        <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Donut Chart: Value by Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Value Distribution by Status</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <SkeletonBox className="h-52 w-full" /> : statusValueData.length === 0 ? (
                <p className="text-sm text-muted-foreground">No valued contracts yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={statusValueData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {statusValueData.map((entry) => (
                        <Cell key={entry.name} fill={DONUT_COLORS[entry.name] ?? "hsl(215,14%,50%)"} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(216,22%,10%)", border: "1px solid hsl(216,18%,16%)", borderRadius: 8, color: "hsl(210,17%,90%)" }}
                      formatter={(val: number) => fmtSGD(val)}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 11, color: "hsl(215,14%,50%)" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Middle Row: Activity + Quick Actions ── */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <div className="flex flex-col items-center py-8 gap-2">
                  <Clock className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No recent activity.</p>
                  <p className="text-xs text-muted-foreground/60">Activity will appear here as contracts are created and updated.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {events.map(evt => (
                    <div
                      key={evt.id}
                      className="flex items-start gap-3 py-2 px-2 rounded-md hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => navigate(`/contracts/${evt.entity_id}`)}
                    >
                      <div className="mt-0.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{eventDescription(evt)}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {evt.actor_name && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <User className="h-3 w-3" />{evt.actor_name}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">{timeAgo(evt.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start gap-2" onClick={() => navigate("/contracts/new")}>
                <Plus className="h-4 w-4" /> New Contract
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate("/contracts")}>
                <FileText className="h-4 w-4" /> View All Contracts
              </Button>
              {needingAttention > 0 && (
                <div className="rounded-lg border border-warning/30 bg-warning/10 p-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <span className="text-sm font-medium text-warning">
                      {needingAttention} contract{needingAttention > 1 ? "s" : ""} needing attention
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    In draft or review for more than 7 days
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Expiring Soon Table ── */}
        {expiringContracts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Contracts Expiring Within 60 Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead className="hidden sm:table-cell">Account</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead className="text-right">Days Left</TableHead>
                      <TableHead className="hidden sm:table-cell text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expiringContracts.map(c => {
                      const days = daysRemaining(c.end_date!);
                      const urgent = days <= 15;
                      return (
                        <TableRow
                          key={c.id}
                          className={cn(
                            "cursor-pointer transition-colors",
                            urgent && "bg-destructive/5 hover:bg-destructive/10",
                          )}
                          onClick={() => navigate(`/contracts/${c.id}`)}
                        >
                          <TableCell className="font-medium">{c.title}</TableCell>
                          <TableCell className="hidden sm:table-cell">{c.account_name || "—"}</TableCell>
                          <TableCell>{fmtDate(c.end_date)}</TableCell>
                          <TableCell className={cn("text-right font-semibold tabular-nums", urgent ? "text-destructive" : "text-warning")}>
                            {days} days
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-right tabular-nums">{c.value ? fmtSGD(c.value) : "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
};

export default Dashboard;
