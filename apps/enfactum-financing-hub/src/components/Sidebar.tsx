import { useState } from "react";
import { EnfactumLogo } from "@repo/ui/enfactum-logo";
import { LayoutDashboard, FileText, BarChart3, TrendingUp, Users, ClipboardCheck, LineChart, CheckCircle2, RefreshCw, ChevronDown, ChevronRight, Sun, Moon, Settings2, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFxRate } from "@/contexts/FxRateContext";
import { usePaymentTerms, TERM_OPTIONS } from "@/contexts/PaymentTermsContext";
import { useActiveAccountNames } from "@/hooks/useAccounts";
import { useTheme } from "next-themes";

const navItems = [
  { id: "dashboard", label: "Dashboard",        icon: LayoutDashboard },
  { id: "invoices",  label: "Invoice Tracker",  icon: FileText },
  { id: "entry",     label: "Invoice Entry",    icon: ClipboardCheck },
  { id: "gst",       label: "GST Report",       icon: Receipt },
  { id: "revenue",   label: "Revenue Analysis", icon: BarChart3 },
  { id: "targets",   label: "Targets & Growth", icon: TrendingUp },
  { id: "accounts",  label: "By Account Lead",  icon: Users },
  { id: "analytics", label: "Analytics",        icon: LineChart },
  { id: "close",     label: "Monthly Close",    icon: CheckCircle2 },
];

interface SidebarProps {
  active: string;
  onNavigate: (id: string) => void;
}

const QUICK_RATES = [
  { label: "1.30", value: 1.30 },
  { label: "1.32", value: 1.32 },
  { label: "1.34", value: 1.34 },
  { label: "1.36", value: 1.36 },
];

const TERM_COLORS: Record<number, string> = {
   0: "hsl(var(--primary))",
   7: "hsl(var(--positive))",
  10: "hsl(var(--positive))",
  15: "hsl(130 55% 45%)",
  30: "hsl(var(--warning))",
  45: "hsl(38 95% 45%)",
  60: "hsl(var(--negative))",
};

export function Sidebar({ active, onNavigate }: SidebarProps) {
  const { usdToSgd, setUsdToSgd, lastUpdated, setLastUpdated } = useFxRate();
  const { terms, setTerm, resetTerms } = usePaymentTerms();
  const ACCOUNTS = useActiveAccountNames();
  const { theme, setTheme } = useTheme();
  const [showFx, setShowFx] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [draftRate, setDraftRate] = useState(usdToSgd.toFixed(4));
  const [saved, setSaved] = useState(false);

  function applyRate(rate: number) {
    setUsdToSgd(rate);
    setDraftRate(rate.toFixed(4));
    const now = new Date().toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
    setLastUpdated(now);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleSave() {
    const parsed = parseFloat(draftRate);
    if (isNaN(parsed) || parsed < 0.5 || parsed > 5) return;
    applyRate(parsed);
  }

  return (
    <aside
      className="flex flex-col w-60 h-screen fixed left-0 top-0 z-30 border-r"
      style={{
        background: "var(--gradient-sidebar)",
        borderColor: "var(--glass-border)",
        backdropFilter: "var(--glass-blur)",
      }}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b flex items-center justify-between" style={{ borderColor: "var(--glass-border)" }}>
        <div className="flex items-center gap-3">
          <EnfactumLogo size={28} />
        </div>
        {/* Theme toggle — glass button */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 hover:scale-110"
          style={{
            background: "var(--glass-btn-bg)",
            border: "1px solid var(--glass-btn-border)",
            color: "hsl(var(--muted-foreground))",
          }}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn("nav-item w-full text-left", active === item.id && "active")}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* FX Rate Panel */}
      <div className="border-t" style={{ borderColor: "var(--glass-border)" }}>
        <button
          onClick={() => setShowFx(f => !f)}
          className="w-full flex items-center justify-between px-4 py-3 text-xs transition-all rounded-none hover:bg-[hsl(var(--surface-3)/0.5)]"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          <div className="flex items-center gap-2">
            <Settings2 className="w-3.5 h-3.5" />
            <span className="font-medium">FX Rate (USD/SGD)</span>
          </div>
          <span
            className="mono font-bold px-2 py-0.5 rounded-lg text-xs"
            style={{
              background: "hsl(var(--warning) / 0.15)",
              color: "hsl(var(--warning))",
              border: "1px solid hsl(var(--warning) / 0.25)",
            }}
          >
            {usdToSgd.toFixed(4)}
          </span>
        </button>

        {showFx && (
          <div className="px-4 pb-4 space-y-3 animate-fade-in" style={{ borderTop: `1px solid var(--glass-border)` }}>
            <div className="pt-3">
              <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
                1 USD =
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.0001"
                  min="0.5"
                  max="5"
                  value={draftRate}
                  onChange={e => setDraftRate(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSave()}
                  className="flex-1 px-2.5 py-2 rounded-xl border text-sm mono outline-none focus:ring-1 focus:ring-primary"
                  style={{
                    background: "var(--glass-btn-bg)",
                    borderColor: "var(--glass-border)",
                    color: "hsl(var(--foreground))",
                  }}
                  placeholder="1.3000"
                />
                <button
                  onClick={handleSave}
                  className="px-3 py-2 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: saved ? "hsl(var(--positive))" : "var(--gradient-primary)",
                    color: "hsl(var(--primary-foreground))",
                    boxShadow: saved ? "none" : "0 2px 8px hsl(210 100% 58% / 0.3)",
                  }}
                >
                  {saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : "Set"}
                </button>
              </div>

              <div className="grid grid-cols-4 gap-1 mt-2">
                {QUICK_RATES.map(r => (
                  <button
                    key={r.label}
                    onClick={() => applyRate(r.value)}
                    className="py-1.5 rounded-lg text-xs mono font-semibold transition-all"
                    style={
                      Math.abs(usdToSgd - r.value) < 0.0001
                        ? { background: "hsl(var(--warning) / 0.2)", color: "hsl(var(--warning))", border: "1px solid hsl(var(--warning) / 0.4)" }
                        : { background: "var(--glass-btn-bg)", color: "hsl(var(--muted-foreground))", border: "1px solid var(--glass-border)" }
                    }
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between mt-2">
                <button
                  onClick={() => applyRate(1.30)}
                  className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  <RefreshCw className="w-3 h-3" /> Reset
                </button>
                {lastUpdated && (
                  <span className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {lastUpdated}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Terms */}
      <div className="border-t" style={{ borderColor: "var(--glass-border)" }}>
        <button
          onClick={() => setShowTerms(f => !f)}
          className="w-full flex items-center justify-between px-4 py-3 text-xs transition-all hover:bg-[hsl(var(--surface-3)/0.5)]"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          <div className="flex items-center gap-2">
            <Settings2 className="w-3.5 h-3.5" />
            <span className="font-medium">Payment Terms</span>
          </div>
          {showTerms
            ? <ChevronDown className="w-3.5 h-3.5" />
            : <ChevronRight className="w-3.5 h-3.5" />}
        </button>

        {showTerms && (
          <div
            className="px-4 pb-4 space-y-2 animate-fade-in overflow-y-auto"
            style={{ borderTop: `1px solid var(--glass-border)`, maxHeight: 240 }}
          >
            <div className="pt-3 flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
                Days per account
              </span>
              <button
                onClick={resetTerms}
                className="flex items-center gap-1 text-[10px] hover:opacity-80 transition-opacity"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                <RefreshCw className="w-3 h-3" /> Reset
              </button>
            </div>

            {ACCOUNTS.map(account => {
              const current = terms[account] ?? 30;
              return (
                <div key={account} className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium truncate flex-1" style={{ color: "hsl(var(--foreground))" }}>
                    {account}
                  </span>
                  <div className="flex gap-0.5 flex-wrap">
                    {TERM_OPTIONS.map(days => (
                      <button
                        key={days}
                        onClick={() => setTerm(account, days)}
                        className="px-1.5 py-1 rounded-lg text-[10px] mono font-semibold transition-all"
                        title={days === 0 ? "Due Immediately" : `Net ${days}`}
                        style={
                          current === days
                            ? { background: TERM_COLORS[days] + "28", color: TERM_COLORS[days], border: `1px solid ${TERM_COLORS[days]}55` }
                            : { background: "var(--glass-btn-bg)", color: "hsl(var(--muted-foreground))", border: "1px solid var(--glass-border)" }
                        }
                      >
                        {days === 0 ? "Imm" : days}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t" style={{ borderColor: "var(--glass-border)" }}>
        <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold" style={{ color: "hsl(var(--sidebar-foreground))" }}>FY2025 Target</span>
            <span className="mono font-bold" style={{ color: "hsl(var(--primary))" }}>80.6%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--surface-4))" }}>
            <div
              className="h-full rounded-full transition-all animate-glow"
              style={{ width: "80.6%", background: "var(--gradient-primary)" }}
            />
          </div>
          <div className="mt-1 text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>S$5M · 80.6% achieved</div>
        </div>
      </div>
    </aside>
  );
}
