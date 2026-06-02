import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { isSupabaseConfigured } from "@/lib/supabase";
import { fetchContractsList } from "@/lib/contracts";
import { TopBar } from "@/components/TopBar";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Search, FileText, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { fmtSGD, fmtDate } from "@/lib/format";
import type { ContractView } from "@/lib/types";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "internal_review", label: "In Review" },
  { value: "sent_to_client", label: "Sent" },
  { value: "active", label: "Active" },
  { value: "signed", label: "Signed" },
  { value: "expired", label: "Expired" },
] as const;

type SortOption = "newest" | "oldest" | "value_high" | "value_low" | "expiring";

const demoBase = {
  renewal_date: null, account_id: null, deal_id: null, owner_id: null,
  scope_summary: null, deliverables: null, payment_terms: null,
  client_signer_name: null, client_signer_email: null, enfactum_signer_id: null,
  internal_notes: null, file_url: null, signed_file_url: null, signed_at: null,
};

const DEMO_CONTRACTS: ContractView[] = [
  { ...demoBase, id: "1", title: "Master Services Agreement — Acme Corp", type: "MSA", status: "active", value: 500000, currency: "SGD", start_date: "2025-01-01", end_date: "2025-12-31", auto_renew: true, account_name: "Acme Corp", deal_title: "Acme Digital Transformation", owner_name: "Rahul Sharma", created_at: "2025-01-01" },
  { ...demoBase, id: "2", title: "SOW — Mobile App Development", type: "SOW", status: "draft", value: 120000, currency: "SGD", start_date: "2025-03-01", end_date: "2025-09-30", auto_renew: false, account_name: "TechStart Inc", deal_title: "TechStart Mobile Project", owner_name: "Priya Patel", created_at: "2025-02-15" },
  { ...demoBase, id: "3", title: "NDA — Globex Partnership", type: "NDA", status: "signed", value: null, currency: null, start_date: "2025-02-01", end_date: "2026-02-01", auto_renew: false, account_name: "Globex Corporation", deal_title: null, owner_name: "Rahul Sharma", created_at: "2025-02-01" },
  { ...demoBase, id: "4", title: "SOW — Data Platform Build", type: "SOW", status: "internal_review", value: 350000, currency: "SGD", start_date: null, end_date: null, auto_renew: false, account_name: "FinServ Ltd", deal_title: "FinServ Data Platform", owner_name: "Demo User", created_at: "2025-03-10" },
  { ...demoBase, id: "5", title: "MSA — Retired Client Agreement", type: "MSA", status: "expired", value: 200000, currency: "SGD", start_date: "2023-01-01", end_date: "2024-12-31", auto_renew: false, account_name: "OldTech Solutions", deal_title: null, owner_name: "Priya Patel", created_at: "2023-01-01" },
];

const Contracts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const { data: contracts = [], isLoading } = useQuery<ContractView[]>({
    queryKey: ["contracts"],
    queryFn: async () => {
      if (!isSupabaseConfigured) return DEMO_CONTRACTS;
      return fetchContractsList();
    },
  });

  const filtered = useMemo(() => {
    let result = contracts;
    if (statusFilter !== "all") result = result.filter((c) => c.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.title.toLowerCase().includes(q) || (c.account_name && c.account_name.toLowerCase().includes(q)));
    }
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "oldest": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "value_high": return (b.value ?? 0) - (a.value ?? 0);
        case "value_low": return (a.value ?? 0) - (b.value ?? 0);
        case "expiring": {
          const aEnd = a.end_date ? new Date(a.end_date).getTime() : Infinity;
          const bEnd = b.end_date ? new Date(b.end_date).getTime() : Infinity;
          return aEnd - bEnd;
        }
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    return result;
  }, [contracts, statusFilter, search, sortBy]);

  const exportCSV = useCallback(() => {
    const headers = ["Title", "Type", "Account", "Deal", "Status", "Value", "Currency", "Start Date", "End Date", "Owner"];
    const rows = filtered.map(c => [
      c.title, c.type, c.account_name ?? "", c.deal_title ?? "", c.status,
      c.value?.toString() ?? "", c.currency ?? "", c.start_date ?? "", c.end_date ?? "", c.owner_name ?? "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contracts_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exported", description: `${filtered.length} contracts exported.` });
  }, [filtered, toast]);

  const exportPDF = useCallback(() => {
    const win = window.open("", "_blank");
    if (!win) { toast({ title: "Popup blocked", description: "Allow popups to export PDF.", variant: "destructive" }); return; }
    const rows = filtered.map(c =>
      `<tr><td>${c.title}</td><td>${c.type}</td><td>${c.account_name ?? "—"}</td><td>${c.status}</td><td style="text-align:right">${c.value != null ? fmtSGD(c.value, c.currency) : "—"}</td><td>${fmtDate(c.end_date)}</td><td>${c.owner_name ?? "—"}</td></tr>`
    ).join("");
    win.document.write(`<!DOCTYPE html><html><head><title>Contracts Export</title><style>
      body{font-family:system-ui,sans-serif;padding:40px;color:#1a1a2e}
      h1{font-size:20px;margin-bottom:4px} p.sub{color:#666;font-size:12px;margin-bottom:20px}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th{background:#f0f0f5;text-align:left;padding:8px 10px;border-bottom:2px solid #ddd;font-weight:600}
      td{padding:7px 10px;border-bottom:1px solid #eee}
      tr:nth-child(even){background:#fafafa}
      @media print{body{padding:20px} button{display:none}}
    </style></head><body>
      <h1>en·Forge — Contracts Report</h1>
      <p class="sub">${filtered.length} contracts · Exported ${fmtDate(new Date().toISOString())}</p>
      <table><thead><tr><th>Title</th><th>Type</th><th>Account</th><th>Status</th><th style="text-align:right">Value</th><th>End Date</th><th>Owner</th></tr></thead><tbody>${rows}</tbody></table>
      <br><button onclick="window.print()" style="padding:8px 20px;background:#3b82f6;color:white;border:none;border-radius:6px;cursor:pointer;font-size:13px">Print / Save as PDF</button>
    </body></html>`);
    win.document.close();
    toast({ title: "PDF ready", description: "Use Print → Save as PDF in the new tab." });
  }, [filtered, toast]);

  return (
    <>
      <TopBar title="Contracts" />
      <main className="flex-1 p-4 sm:p-6 space-y-4 overflow-auto">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by title or account…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-40 h-10">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="value_high">Value: High → Low</SelectItem>
                <SelectItem value="value_low">Value: Low → High</SelectItem>
                <SelectItem value="expiring">Expiring soonest</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Download className="h-3.5 w-3.5" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportCSV}>Export as CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={exportPDF}>Export as PDF</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => navigate("/contracts/new")} className="gap-1 shrink-0">
              <Plus className="h-4 w-4" /> New Contract
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button key={f.value} onClick={() => setStatusFilter(f.value)} className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors border", statusFilter === f.value ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-secondary-foreground border-border hover:bg-accent/20")}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Type</TableHead>
                <TableHead className="hidden lg:table-cell">Account</TableHead>
                <TableHead className="hidden xl:table-cell">Deal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Value</TableHead>
                <TableHead className="hidden md:table-cell">End Date</TableHead>
                <TableHead className="hidden lg:table-cell">Owner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <FileText className="h-10 w-10 text-muted-foreground/40" />
                      <div>
                        <p className="font-medium text-foreground">
                          {contracts.length === 0 ? "No contracts yet" : "No contracts match your filters"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {contracts.length === 0 ? "Create your first contract to get started." : "Try adjusting your search or filter criteria."}
                        </p>
                      </div>
                      {contracts.length === 0 && (
                        <Button onClick={() => navigate("/contracts/new")} className="mt-2 gap-1">
                          <Plus className="h-4 w-4" /> New Contract
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtered.map((c) => (
                <TableRow key={c.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => navigate(`/contracts/${c.id}`)}>
                  <TableCell className="font-medium max-w-[250px] truncate">{c.title}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{c.type}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">{c.account_name || "—"}</TableCell>
                  <TableCell className="hidden xl:table-cell text-muted-foreground">{c.deal_title || "—"}</TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                  <TableCell className="hidden sm:table-cell text-right tabular-nums">{fmtSGD(c.value, c.currency)}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{fmtDate(c.end_date)}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">{c.owner_name || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </>
  );
};

export default Contracts;
