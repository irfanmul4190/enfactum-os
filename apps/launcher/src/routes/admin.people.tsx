// Plain React component rendered conditionally from App.tsx when
// window.location.pathname === "/admin/people". The launcher doesn't use
// TanStack Router; the filename matches src/routes/ for parity but it's
// not a TanStack route.
import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import type { AuthUser } from "@/lib/auth";
import {
  fetchSelf,
  listEmployeesWithAccess,
  addEmployee,
  updateEmployee,
  setAccess,
  deleteEmployee,
  isMatrixAdmin,
  APPS,
  type AccessLevel,
  type AppId,
  type Employee,
  type EmployeeWithAccess,
} from "@/lib/employees";

const ACCESS_LEVELS: AccessLevel[] = ["none", "read", "write", "admin"];

function navigate(path: string) {
  globalThis.history.pushState({}, "", path);
  globalThis.dispatchEvent(new PopStateEvent("popstate"));
}

type GateState =
  | { kind: "loading" }
  | { kind: "not_admin"; email: string }
  | { kind: "ok"; me: Employee };

export default function AdminPeoplePage({ user }: Readonly<{ user: AuthUser }>) {
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
        setGate({ kind: "ok", me });
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
  return <Matrix me={gate.me} />;
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
          <span className="font-mono">{email}</span> is signed in but doesn't have the
          {" "}<span className="font-semibold">matrix admin</span> flag. Ask an existing
          matrix admin to grant you that role to manage people.
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

function Matrix({ me }: Readonly<{ me: Employee }>) {
  const [rows, setRows] = useState<EmployeeWithAccess[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const refresh = async () => {
    try {
      setError(null);
      const list = await listEmployeesWithAccess();
      setRows(list);
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

  const onDelete = (emp: Employee) => {
    if (emp.id === me.id) {
      setError("You can't delete your own row from here. Have another matrix admin do it.");
      return;
    }
    if (!confirm(`Delete ${emp.email}? This removes them from every app. Irreversible.`)) return;
    void handle(() => deleteEmployee(emp.id));
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
          <h1 className="text-sm font-bold tracking-tight">Access Matrix · Admin</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin/accounts")}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Accounts →
            </button>
            <button
              onClick={() => setShowAdd((s) => !s)}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-4">
        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {showAdd && (
          <AddForm
            onCancel={() => setShowAdd(false)}
            onDone={async () => {
              setShowAdd(false);
              await refresh();
            }}
            onError={setError}
          />
        )}

        {rows === null ? (
          <CenteredSpinner />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/60 bg-card/40">
            <table className="w-full text-sm">
              <thead className="border-b border-border/60 bg-card/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-semibold">Email</th>
                  <th className="px-3 py-2 font-semibold">Name</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold text-center">Matrix admin</th>
                  {APPS.map((app) => (
                    <th key={app.id} className="px-3 py-2 font-semibold whitespace-nowrap">
                      {app.label}
                    </th>
                  ))}
                  <th className="px-3 py-2 font-semibold w-px"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((emp) => (
                  <Row
                    key={emp.id}
                    emp={emp}
                    isSelf={emp.id === me.id}
                    busy={busy}
                    onName={(name) => handle(() => updateEmployee(emp.id, { name }))}
                    onStatus={(status) => handle(() => updateEmployee(emp.id, { status }))}
                    onMatrixAdmin={(flag) =>
                      handle(() => updateEmployee(emp.id, { is_matrix_admin: flag }))
                    }
                    onAccess={(app, level) => handle(() => setAccess(emp.id, app, level))}
                    onDelete={() => onDelete(emp)}
                  />
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5 + APPS.length} className="px-3 py-8 text-center text-muted-foreground">
                      No employees yet. Add one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            Changes take effect on the user's next page load (or token refresh,
            typically within an hour for users currently signed in). Set status to{" "}
            <span className="font-mono">suspended</span> to block sign-in without losing
            the row.
          </p>
          <p>
            <strong>Matrix admin</strong> grants the ability to edit this page. It is
            independent from per-app admin: a person can be matrix admin without having
            admin access to any specific app, and vice versa.
          </p>
        </div>
      </main>
    </div>
  );
}

function Row({
  emp,
  isSelf,
  busy,
  onName,
  onStatus,
  onMatrixAdmin,
  onAccess,
  onDelete,
}: Readonly<{
  emp: EmployeeWithAccess;
  isSelf: boolean;
  busy: boolean;
  onName: (name: string) => Promise<unknown>;
  onStatus: (status: "active" | "suspended") => Promise<unknown>;
  onMatrixAdmin: (flag: boolean) => Promise<unknown>;
  onAccess: (app: AppId, level: AccessLevel) => Promise<unknown>;
  onDelete: () => void;
}>) {
  const status = (emp.status ?? "active") as "active" | "suspended";
  return (
    <tr className="border-b border-border/40 last:border-0">
      <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">
        {emp.email}
        {isSelf && <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">you</span>}
      </td>
      <td className="px-3 py-2 min-w-[150px]">
        <input
          defaultValue={emp.name}
          disabled={busy}
          onBlur={(e) => {
            if (e.target.value !== emp.name) void onName(e.target.value);
          }}
          className="w-full bg-transparent text-sm outline-none focus:bg-background/60 rounded px-1"
        />
      </td>
      <td className="px-3 py-2">
        <button
          disabled={busy || isSelf}
          onClick={() => void onStatus(status === "active" ? "suspended" : "active")}
          className={`text-xs font-semibold rounded px-2 py-0.5 whitespace-nowrap ${
            status === "active"
              ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
              : "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
          } disabled:opacity-40 disabled:cursor-not-allowed`}
          title={isSelf ? "You can't suspend yourself" : "Toggle status"}
        >
          {status}
        </button>
      </td>
      <td className="px-3 py-2 text-center">
        <input
          type="checkbox"
          checked={!!emp.is_matrix_admin}
          disabled={busy || isSelf}
          onChange={(e) => void onMatrixAdmin(e.target.checked)}
          title={isSelf ? "You can't remove your own matrix-admin flag" : "Matrix admin"}
          className="h-4 w-4 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        />
      </td>
      {APPS.map((app) => (
        <td key={app.id} className="px-3 py-2">
          <AccessSelect
            value={emp.access[app.id]}
            disabled={busy}
            onChange={(level) => void onAccess(app.id, level)}
          />
        </td>
      ))}
      <td className="px-3 py-2">
        <button
          disabled={busy || isSelf}
          onClick={onDelete}
          className="text-muted-foreground hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed"
          title={isSelf ? "Can't delete yourself" : "Delete"}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

function AccessSelect({
  value,
  disabled,
  onChange,
}: Readonly<{
  value: AccessLevel;
  disabled: boolean;
  onChange: (level: AccessLevel) => void;
}>) {
  const tone =
    value === "admin"
      ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30"
      : value === "write"
      ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30"
      : value === "read"
      ? "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30"
      : "bg-transparent text-muted-foreground border-border/40";
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as AccessLevel)}
      className={`border rounded px-2 py-1 text-xs font-medium ${tone} disabled:opacity-50`}
    >
      {ACCESS_LEVELS.map((lvl) => (
        <option key={lvl} value={lvl}>{lvl}</option>
      ))}
    </select>
  );
}

function AddForm({
  onCancel,
  onDone,
  onError,
}: Readonly<{
  onCancel: () => void;
  onDone: () => Promise<void>;
  onError: (msg: string) => void;
}>) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [access, setAccess] = useState<Record<AppId, AccessLevel>>(() => {
    const init: Record<AppId, AccessLevel> = {} as Record<AppId, AccessLevel>;
    for (const app of APPS) init[app.id] = "read";
    return init;
  });
  const [matrixAdmin, setMatrixAdmin] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await addEmployee(
        { name, email, status: "active", is_matrix_admin: matrixAdmin },
        access,
      );
      await onDone();
      setName("");
      setEmail("");
      setMatrixAdmin(false);
    } catch (err: any) {
      onError(err.message ?? String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-muted-foreground">Name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full bg-background border border-border/60 rounded px-2 py-1.5 text-sm"
            placeholder="Jane Doe"
          />
        </label>
        <label className="block">
          <span className="text-xs text-muted-foreground">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full bg-background border border-border/60 rounded px-2 py-1.5 text-sm font-mono"
            placeholder="jane@enfactum.com"
          />
        </label>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {APPS.map((app) => (
          <label key={app.id} className="block">
            <span className="text-xs text-muted-foreground">{app.label}</span>
            <select
              value={access[app.id]}
              onChange={(e) =>
                setAccess((prev) => ({ ...prev, [app.id]: e.target.value as AccessLevel }))
              }
              className="mt-1 w-full bg-background border border-border/60 rounded px-2 py-1.5 text-sm"
            >
              {ACCESS_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>
          </label>
        ))}
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input
            type="checkbox"
            checked={matrixAdmin}
            onChange={(e) => setMatrixAdmin(e.target.checked)}
            className="h-4 w-4"
          />
          Matrix admin
        </label>
      </div>
      <div className="flex gap-2 justify-end">
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
