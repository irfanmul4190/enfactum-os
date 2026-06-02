// Plain React component, like admin.people.tsx — rendered from App.tsx when
// window.location.pathname === "/admin/accounts".
import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import type { AuthUser } from "@/lib/auth";
import { fetchSelf, isMatrixAdmin, type Employee } from "@/lib/employees";
import {
  listAccounts,
  addAccount,
  updateAccount,
  deleteAccount,
  listLeads,
  addLead,
  updateLead,
  deleteLead,
  type AccountRow,
  type AccountLeadRow,
} from "@/lib/accounts";

const CURRENCIES = ["SGD", "USD", "INR", "MYR", "IDR", "PHP", "VND", "THB", "JPY", "AUD"];
const TERM_DAYS = [0, 7, 10, 15, 30, 45, 60];

function navigate(path: string) {
  globalThis.history.pushState({}, "", path);
  globalThis.dispatchEvent(new PopStateEvent("popstate"));
}

type GateState =
  | { kind: "loading" }
  | { kind: "not_admin"; email: string }
  | { kind: "ok" };

export default function AdminAccountsPage({ user }: Readonly<{ user: AuthUser }>) {
  const [gate, setGate] = useState<GateState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const me = await fetchSelf(user.email ?? "");
        if (cancelled) return;
        if (!me || !isMatrixAdmin(me)) {
          setGate({ kind: "not_admin", email: user.email ?? "unknown" });
          return;
        }
        setGate({ kind: "ok" });
      } catch (err) {
        if (import.meta.env.DEV) console.error("admin gate check failed:", err);
        if (!cancelled) setGate({ kind: "not_admin", email: user.email ?? "unknown" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user.email]);

  if (gate.kind === "loading") return <CenteredSpinner />;
  if (gate.kind === "not_admin") return <NotAdmin email={gate.email} />;
  return <Tables />;
}

function CenteredSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <svg className="h-6 w-6 animate-spin text-muted-foreground" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}

function NotAdmin({ email }: Readonly<{ email: string }>) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-xl font-semibold">Matrix admin only</h1>
        <p className="text-sm text-muted-foreground">
          <span className="font-mono">{email}</span> isn't a matrix admin. Ask one to
          grant you that role, or have them manage accounts/leads directly.
        </p>
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to launcher
        </button>
      </div>
    </div>
  );
}

function Tables() {
  const [accounts, setAccounts] = useState<AccountRow[] | null>(null);
  const [leads, setLeads] = useState<AccountLeadRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    try {
      setError(null);
      const [a, l] = await Promise.all([listAccounts(), listLeads()]);
      setAccounts(a);
      setLeads(l);
    } catch (e: any) {
      setError(e.message ?? String(e));
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const handle = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      await refresh();
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Launcher
          </button>
          <h1 className="text-sm font-bold tracking-tight">Accounts & Leads · Admin</h1>
          <button
            onClick={() => navigate("/admin/people")}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            People →
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <AccountsSection rows={accounts} busy={busy} onChange={handle} onError={setError} />
        <LeadsSection rows={leads} busy={busy} onChange={handle} onError={setError} />

        <p className="text-xs text-muted-foreground">
          These tables feed the dropdowns and aggregation logic inside
          Financing Hub (and any future app that wires to <span className="font-mono">accounts</span>).
          Toggle <span className="font-mono">active</span> to remove an entry from app dropdowns without
          deleting the row.
        </p>
      </main>
    </div>
  );
}

// ─── Accounts section ─────────────────────────────────────────────────────

function AccountsSection({
  rows,
  busy,
  onChange,
  onError,
}: Readonly<{
  rows: AccountRow[] | null;
  busy: boolean;
  onChange: (fn: () => Promise<unknown>) => Promise<void>;
  onError: (msg: string) => void;
}>) {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Accounts</h2>
        <button
          onClick={() => setShowAdd((s) => !s)}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" />
          Add account
        </button>
      </div>

      {showAdd && (
        <AddAccountForm
          onCancel={() => setShowAdd(false)}
          onDone={async () => {
            setShowAdd(false);
          }}
          onSubmit={(input) =>
            onChange(async () => {
              await addAccount(input);
            })
          }
          onError={onError}
        />
      )}

      {rows === null ? (
        <CenteredSpinner />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/60 bg-card/40">
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 bg-card/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-semibold">Name</th>
                <th className="px-3 py-2 font-semibold">Default terms</th>
                <th className="px-3 py-2 font-semibold">Currency</th>
                <th className="px-3 py-2 font-semibold">Active</th>
                <th className="px-3 py-2 font-semibold w-px"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((acc) => (
                <AccountRowView
                  key={acc.id}
                  acc={acc}
                  busy={busy}
                  onPatch={(patch) =>
                    onChange(async () => {
                      await updateAccount(acc.id, patch);
                    })
                  }
                  onDelete={() => {
                    if (!confirm(`Delete account "${acc.name}"? Invoices already tagged with this name will still display.`)) return;
                    void onChange(async () => {
                      await deleteAccount(acc.id);
                    });
                  }}
                />
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                    No accounts yet. Add one above to populate Financing Hub dropdowns.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function AccountRowView({
  acc,
  busy,
  onPatch,
  onDelete,
}: Readonly<{
  acc: AccountRow;
  busy: boolean;
  onPatch: (patch: Partial<{ name: string; default_payment_terms_days: number; billing_currency: string; active: boolean }>) => Promise<void>;
  onDelete: () => void;
}>) {
  return (
    <tr className="border-b border-border/40 last:border-0">
      <td className="px-3 py-2">
        <input
          defaultValue={acc.name}
          disabled={busy}
          onBlur={(e) => {
            if (e.target.value !== acc.name) void onPatch({ name: e.target.value });
          }}
          className="w-full bg-transparent text-sm outline-none focus:bg-background/60 rounded px-1"
        />
      </td>
      <td className="px-3 py-2">
        <select
          value={acc.default_payment_terms_days ?? 30}
          disabled={busy}
          onChange={(e) => void onPatch({ default_payment_terms_days: Number(e.target.value) })}
          className="bg-background/60 border border-border/60 rounded px-2 py-1 text-sm"
        >
          {TERM_DAYS.map((d) => (
            <option key={d} value={d}>{d === 0 ? "Due on receipt" : `Net ${d}`}</option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2">
        <select
          value={acc.billing_currency ?? "SGD"}
          disabled={busy}
          onChange={(e) => void onPatch({ billing_currency: e.target.value })}
          className="bg-background/60 border border-border/60 rounded px-2 py-1 text-sm"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2">
        <button
          disabled={busy}
          onClick={() => void onPatch({ active: !acc.active })}
          className={`text-xs font-semibold rounded px-2 py-0.5 ${
            acc.active
              ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
              : "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
          } disabled:opacity-40`}
        >
          {acc.active ? "active" : "inactive"}
        </button>
      </td>
      <td className="px-3 py-2">
        <button
          disabled={busy}
          onClick={onDelete}
          className="text-muted-foreground hover:text-destructive disabled:opacity-30"
          title="Delete account"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

function AddAccountForm({
  onCancel,
  onDone,
  onSubmit,
  onError,
}: Readonly<{
  onCancel: () => void;
  onDone: () => Promise<void>;
  onSubmit: (input: { name: string; default_payment_terms_days: number; billing_currency: string; active: boolean }) => Promise<void>;
  onError: (msg: string) => void;
}>) {
  const [name, setName] = useState("");
  const [days, setDays] = useState(30);
  const [currency, setCurrency] = useState("SGD");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onSubmit({ name, default_payment_terms_days: days, billing_currency: currency, active: true });
      await onDone();
      setName("");
      setDays(30);
      setCurrency("SGD");
    } catch (err: any) {
      onError(err.message ?? String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-border/60 bg-card/40 p-4 grid grid-cols-1 md:grid-cols-[1fr_140px_120px_auto] gap-3 items-end"
    >
      <label className="block">
        <span className="text-xs text-muted-foreground">Account name</span>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full bg-background border border-border/60 rounded px-2 py-1.5 text-sm"
        />
      </label>
      <label className="block">
        <span className="text-xs text-muted-foreground">Default terms</span>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="mt-1 w-full bg-background border border-border/60 rounded px-2 py-1.5 text-sm"
        >
          {TERM_DAYS.map((d) => (
            <option key={d} value={d}>{d === 0 ? "Due on receipt" : `Net ${d}`}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-xs text-muted-foreground">Currency</span>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="mt-1 w-full bg-background border border-border/60 rounded px-2 py-1.5 text-sm"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="rounded border border-border/60 px-3 py-1.5 text-xs hover:bg-accent"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Adding…" : "Add"}
        </button>
      </div>
    </form>
  );
}

// ─── Leads section ────────────────────────────────────────────────────────

function LeadsSection({
  rows,
  busy,
  onChange,
  onError,
}: Readonly<{
  rows: AccountLeadRow[] | null;
  busy: boolean;
  onChange: (fn: () => Promise<unknown>) => Promise<void>;
  onError: (msg: string) => void;
}>) {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Account Leads</h2>
        <button
          onClick={() => setShowAdd((s) => !s)}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" />
          Add lead
        </button>
      </div>

      {showAdd && (
        <AddLeadForm
          onCancel={() => setShowAdd(false)}
          onDone={async () => setShowAdd(false)}
          onSubmit={(input) => onChange(async () => { await addLead(input); })}
          onError={onError}
        />
      )}

      {rows === null ? (
        <CenteredSpinner />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/60 bg-card/40">
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 bg-card/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-semibold">Name</th>
                <th className="px-3 py-2 font-semibold">Email (optional)</th>
                <th className="px-3 py-2 font-semibold">Active</th>
                <th className="px-3 py-2 font-semibold w-px"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((lead) => (
                <LeadRowView
                  key={lead.id}
                  lead={lead}
                  busy={busy}
                  onPatch={(patch) => onChange(async () => { await updateLead(lead.id, patch); })}
                  onDelete={() => {
                    if (!confirm(`Delete lead "${lead.name}"? Invoices already tagged with this name will still display.`)) return;
                    void onChange(async () => { await deleteLead(lead.id); });
                  }}
                />
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                    No leads yet. Add one to populate the Account Lead dropdown.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function LeadRowView({
  lead,
  busy,
  onPatch,
  onDelete,
}: Readonly<{
  lead: AccountLeadRow;
  busy: boolean;
  onPatch: (patch: Partial<{ name: string; email: string | null; active: boolean }>) => Promise<void>;
  onDelete: () => void;
}>) {
  return (
    <tr className="border-b border-border/40 last:border-0">
      <td className="px-3 py-2">
        <input
          defaultValue={lead.name}
          disabled={busy}
          onBlur={(e) => { if (e.target.value !== lead.name) void onPatch({ name: e.target.value }); }}
          className="w-full bg-transparent text-sm outline-none focus:bg-background/60 rounded px-1"
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="email"
          defaultValue={lead.email ?? ""}
          disabled={busy}
          onBlur={(e) => {
            const next = e.target.value || null;
            if (next !== lead.email) void onPatch({ email: next });
          }}
          className="w-full bg-transparent text-sm outline-none focus:bg-background/60 rounded px-1 font-mono"
        />
      </td>
      <td className="px-3 py-2">
        <button
          disabled={busy}
          onClick={() => void onPatch({ active: !lead.active })}
          className={`text-xs font-semibold rounded px-2 py-0.5 ${
            lead.active
              ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
              : "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
          } disabled:opacity-40`}
        >
          {lead.active ? "active" : "inactive"}
        </button>
      </td>
      <td className="px-3 py-2">
        <button
          disabled={busy}
          onClick={onDelete}
          className="text-muted-foreground hover:text-destructive disabled:opacity-30"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

function AddLeadForm({
  onCancel,
  onDone,
  onSubmit,
  onError,
}: Readonly<{
  onCancel: () => void;
  onDone: () => Promise<void>;
  onSubmit: (input: { name: string; email: string | null; active: boolean }) => Promise<void>;
  onError: (msg: string) => void;
}>) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onSubmit({ name, email: email || null, active: true });
      await onDone();
      setName("");
      setEmail("");
    } catch (err: any) {
      onError(err.message ?? String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-border/60 bg-card/40 p-4 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end"
    >
      <label className="block">
        <span className="text-xs text-muted-foreground">Name</span>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full bg-background border border-border/60 rounded px-2 py-1.5 text-sm"
        />
      </label>
      <label className="block">
        <span className="text-xs text-muted-foreground">Email (optional)</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full bg-background border border-border/60 rounded px-2 py-1.5 text-sm font-mono"
        />
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="rounded border border-border/60 px-3 py-1.5 text-xs hover:bg-accent"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Adding…" : "Add"}
        </button>
      </div>
    </form>
  );
}
