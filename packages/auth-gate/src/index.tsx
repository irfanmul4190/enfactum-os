/**
 * @enfactum/auth-gate
 *
 * Shared auth wrapper for every secured app in the intranet. Replaces the
 * five near-identical AuthContext.tsx files that used to live in each app.
 *
 * Each app calls `createAuthGate({ supabase, appId, appBasePath, appLabel })`
 * once and gets back `{ AuthProvider, useAuth }` bound to that app. The
 * provider runs the three-step gate on every sign-in:
 *   1. Email must end with @enfactum.com
 *   2. An `employees` row must exist for that email with status='active'
 *   3. An `employee_app_access` row must exist for (employees.id, app=<appId>)
 *      with access_level != 'none'
 *
 * Any failure signs the user out and surfaces `authError` so the Login page
 * can show it. RLS enforces all of this server-side too; the client gate
 * just fails fast and surfaces meaningful errors.
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";

const ALLOWED_EMAIL_DOMAIN = "@enfactum.com";

/**
 * Canonical list of apps recognised by the access matrix. Add a new entry
 * here when you ship a new app — and update RLS + the launcher card UI in
 * lockstep (see nginx.conf header for the checklist).
 *
 * The launcher's /admin/people matrix UI reads this list to render columns,
 * and HR Hub's new-employee flow reads it to seed `employee_app_access`
 * rows so new hires get default 'read' access everywhere.
 */
export const ACCESS_MATRIX_APPS = [
  { id: "pipeline-pro", label: "Pipeline Pro" },
  { id: "profit-navigator", label: "Profit Navigator" },
  { id: "enfactum-financing-hub", label: "Financing Hub" },
  { id: "market-grammer", label: "Market-Grammer" },
  { id: "hr-hub", label: "HR Hub" },
  { id: "enfactum-mdf-central", label: "MDF Central" },
  { id: "enforge-contract-craft", label: "Enforge Contract Craft" },
] as const;

export type AccessMatrixAppId = (typeof ACCESS_MATRIX_APPS)[number]["id"];

export type AccessLevel = "none" | "read" | "write" | "admin";

export interface AuthEmployee {
  id: string;
  name: string;
  email: string;
  role: string | null;
  status: string | null;
  department: string | null;
  designation: string | null;
  is_matrix_admin: boolean | null;
  auth_user_id: string | null;
}

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  employee: AuthEmployee | null;
  accessLevel: AccessLevel;
  canRead: boolean;
  canWrite: boolean;
  canAdmin: boolean;
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export interface CreateAuthGateOptions {
  supabase: SupabaseClient;
  /** App id used in the access matrix, e.g. "hr-hub". */
  appId: string;
  /** Base path the app is mounted at, e.g. "/hr-hub/". Used for OAuth redirect. */
  appBasePath: string;
  /** Human-readable app label for error messages, e.g. "HR Hub". */
  appLabel: string;
}

const SELECT_COLUMNS =
  "id, name, email, role, status, department, designation, is_matrix_admin, auth_user_id";

export function createAuthGate({
  supabase,
  appId,
  appBasePath,
  appLabel,
}: CreateAuthGateOptions) {
  const AuthContext = createContext<AuthContextValue>({
    session: null,
    user: null,
    employee: null,
    accessLevel: "none",
    canRead: false,
    canWrite: false,
    canAdmin: false,
    loading: true,
    authError: null,
    signInWithGoogle: async () => {},
    signOut: async () => {},
  });

  function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
    const [session, setSession] = useState<Session | null>(null);
    const [employee, setEmployee] = useState<AuthEmployee | null>(null);
    const [accessLevel, setAccessLevel] = useState<AccessLevel>("none");
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);

    async function gateOrSignOut(
      supabaseSession: Session,
    ): Promise<
      { ok: true; emp: AuthEmployee; level: AccessLevel } | { ok: false }
    > {
      const email = supabaseSession.user?.email;
      if (!email || !email.toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN)) {
        await supabase.auth.signOut();
        setAuthError(
          `Access restricted to ${ALLOWED_EMAIL_DOMAIN} accounts. Signed-in account: ${email ?? "unknown"}.`,
        );
        return { ok: false };
      }

      const { data: emp, error: empErr } = await supabase
        .from("employees")
        .select(SELECT_COLUMNS)
        .eq("email", email)
        .maybeSingle();

      if (empErr) {
        if (import.meta.env.DEV) console.error("Error looking up employee row:", empErr);
        await supabase.auth.signOut();
        setAuthError("Could not verify your access. Please try again.");
        return { ok: false };
      }
      if (!emp) {
        await supabase.auth.signOut();
        setAuthError(`${email} is not on the access list. Ask an admin to add you.`);
        return { ok: false };
      }
      const empRow = emp as AuthEmployee;
      if (empRow.status && empRow.status !== "active") {
        await supabase.auth.signOut();
        setAuthError(`Your account (${email}) is ${empRow.status}. Ask an admin to reactivate it.`);
        return { ok: false };
      }

      const { data: access, error: accessErr } = await supabase
        .from("employee_app_access")
        .select("access_level")
        .eq("employee_id", empRow.id)
        .eq("app", appId)
        .maybeSingle();

      if (accessErr) {
        if (import.meta.env.DEV) console.error("Error looking up app access:", accessErr);
        await supabase.auth.signOut();
        setAuthError("Could not verify your access. Please try again.");
        return { ok: false };
      }

      const level = ((access as { access_level: AccessLevel } | null)?.access_level ?? "none") as AccessLevel;
      if (level === "none") {
        await supabase.auth.signOut();
        setAuthError(`${email} doesn't have access to ${appLabel}. Ask an admin to grant access.`);
        return { ok: false };
      }

      setAuthError(null);
      return { ok: true, emp: empRow, level };
    }

    useEffect(() => {
      const apply = (sess: Session | null) => {
        if (sess?.user?.email) {
          setTimeout(async () => {
            const result = await gateOrSignOut(sess);
            if (result.ok) {
              setSession(sess);
              setEmployee(result.emp);
              setAccessLevel(result.level);
            } else {
              setSession(null);
              setEmployee(null);
              setAccessLevel("none");
            }
            setLoading(false);
          }, 0);
        } else {
          setSession(null);
          setEmployee(null);
          setAccessLevel("none");
          setLoading(false);
        }
      };

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, sess) => apply(sess),
      );

      supabase.auth.getSession().then(({ data: { session: s } }) => apply(s));

      return () => subscription.unsubscribe();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function signInWithGoogle() {
      setAuthError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${globalThis.location.origin}${appBasePath}`,
          queryParams: { hd: "enfactum.com" },
        },
      });
      if (error) throw error;
    }

    async function signOut() {
      await supabase.auth.signOut();
      setEmployee(null);
      setAccessLevel("none");
      setAuthError(null);
    }

    const canRead = accessLevel !== "none";
    const canWrite = accessLevel === "write" || accessLevel === "admin";
    const canAdmin = accessLevel === "admin";

    return (
      <AuthContext.Provider
        value={{
          session,
          user: session?.user ?? null,
          employee,
          accessLevel,
          canRead,
          canWrite,
          canAdmin,
          loading,
          authError,
          signInWithGoogle,
          signOut,
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  }

  function useAuth(): AuthContextValue {
    return useContext(AuthContext);
  }

  return { AuthProvider, useAuth };
}
