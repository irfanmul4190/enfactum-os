import { lazy, Suspense, useEffect, useMemo, useState, type CSSProperties } from "react";
import { Moon, Sun, LogOut, ShieldCheck, Mail } from "lucide-react";
import { launcherApps } from "@/lib/app-urls";
import {
  signInWithGoogle,
  signOutUser,
  subscribeToAuthState,
  type AuthUser,
} from "@/lib/auth";
import { fetchSelf, isMatrixAdmin } from "@/lib/employees";

// Admin sub-routes at /admin/*. Lazy-loaded so the launcher's first-load
// cost doesn't grow for users who never open them.
const AdminPeoplePage = lazy(() => import("./routes/admin.people"));
const AdminAccountsPage = lazy(() => import("./routes/admin.accounts"));

function usePathname(): string {
  const [path, setPath] = useState(() =>
    typeof window === "undefined" ? "/" : globalThis.location.pathname,
  );
  useEffect(() => {
    const onChange = () => setPath(globalThis.location.pathname);
    globalThis.addEventListener("popstate", onChange);
    return () => globalThis.removeEventListener("popstate", onChange);
  }, []);
  return path;
}

const partnerTools = [
  {
    id: "mavic-ai",
    name: "Mavic AI",
    href: "https://www.mavic.ai",
    logoUrl: "https://www.google.com/s2/favicons?domain=mavic.ai&sz=64",
  },
  {
    id: "addlly",
    name: "Addlly",
    href: "https://addlly.ai",
    logoUrl: "https://www.google.com/s2/favicons?domain=addlly.ai&sz=64",
  },
  {
    id: "canva",
    name: "Canva",
    href: "https://www.canva.com",
    logoUrl: "https://www.google.com/s2/favicons?domain=canva.com&sz=64",
  },
  {
    id: "adobe-creative-cloud",
    name: "Adobe Creative Cloud",
    href: "https://creativecloud.adobe.com",
    logoUrl: "https://www.google.com/s2/favicons?domain=creativecloud.adobe.com&sz=64",
  },
  {
    id: "sprouts-ai",
    name: "Sprouts Ai",
    href: "https://www.sprouts.ai",
    logoUrl: "https://www.google.com/s2/favicons?domain=sprouts.ai&sz=64",
  },
  {
    id: "claude",
    name: "Claude",
    href: "https://claude.ai",
    logoUrl: "https://www.google.com/s2/favicons?domain=claude.ai&sz=64",
  },
  {
    id: "gemini-pro",
    name: "Gemini Pro",
    href: "https://gemini.google.com",
    logoUrl: "https://www.google.com/s2/favicons?domain=gemini.google.com&sz=64",
  },
  {
    id: "chat-gpt",
    name: "Chat GPT",
    href: "https://chatgpt.com",
    logoUrl: "https://www.google.com/s2/favicons?domain=chatgpt.com&sz=64",
  },
];

function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark =
      stored === "dark" ||
      (!stored && globalThis.window.matchMedia("(prefers-color-scheme: dark)").matches);
    setIsDark(prefersDark);
    document.documentElement.classList.toggle("dark", prefersDark);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-accent"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

function LoginScreen({
  onLogin,
  error,
}: {
  onLogin: () => Promise<void>;
  error: string | null;
}) {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="absolute top-[-10%] left-[-10%] h-64 w-64 rounded-full bg-cyan-500/20 blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-72 w-72 rounded-full bg-indigo-500/20 blur-[110px]" />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
            E
          </div>
        </div>
        <h1 className="mt-6 text-center text-2xl font-semibold text-slate-900">
          Enfactum Intranet
        </h1>
        <p className="mt-2 text-center text-sm text-slate-500">
          Sign in with your Google Workspace account to continue.
        </p>
        <button
          type="button"
          onClick={onLogin}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          <Mail className="h-4 w-4 text-red-500" />
          Sign in with Google Workspace
        </button>
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        )}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="h-4 w-4" />
          Protected by Enterprise SSO
        </div>
      </div>
    </div>
  );
}

function LauncherShell({ user }: { user: AuthUser | null }) {
  const today = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    [],
  );

  // Surface the admin entry point only to matrix admins. The /admin/* pages
  // gate themselves too, but without this link they were unreachable except
  // by typing the URL.
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const email = user?.email;
    if (!email) {
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    void fetchSelf(email)
      .then((me) => {
        if (!cancelled) setIsAdmin(isMatrixAdmin(me));
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-card/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-tight">
              <span>en</span>
              <span className="text-[#0057FF]">fact</span>
              <span>um</span> OS
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{today}</span>
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  globalThis.history.pushState({}, "", "/admin/people");
                  globalThis.dispatchEvent(new PopStateEvent("popstate"));
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Admin
              </button>
            )}
            <ThemeToggle />
            {user && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="hidden sm:inline">{user.name ?? user.email}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-14">
        <section className="mb-12">
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
            Elevating Our Workflow
          </h1>
          <div className="mt-5 max-w-2xl space-y-3 text-base text-muted-foreground sm:text-lg">
            <p className="leading-relaxed">
              We&apos;re building a smarter intranet to help you focus on what you do best. This
              launcher connects you to our evolving library of AI tools for smoother tracking and
              faster proposals.
            </p>
            <p className="leading-relaxed">
              We&apos;re polishing the more apps and will be dropping them into your dashboard shortly.
            </p>
          </div>
        </section>

        <section
          aria-label="Applications"
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {launcherApps.map((app) => {
            const Icon = app.icon;
            const isActive = app.status === "active";
            return (
              <a
                key={app.id}
                href={app.href}
                target={isActive ? "_blank" : undefined}
                rel={isActive ? "noreferrer" : undefined}
                aria-disabled={!isActive}
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-[0_16px_44px_-16px_var(--app-glow)]"
                style={{ "--app-glow": app.glow } as CSSProperties}
                onClick={(event) => {
                  if (!isActive) {
                    event.preventDefault();
                  }
                }}
              >
                <div
                  className={`absolute inset-0 -z-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-100 ${app.gradient}`}
                  aria-hidden
                />
                <div className="relative">
                  <div
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br ${app.gradient}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-5 text-lg font-semibold text-card-foreground">
                    {app.title}
                  </h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">{app.description}</p>
                  {!isActive && (
                    <span className="mt-3 inline-flex items-center rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
                      Coming soon
                    </span>
                  )}
                  <span className="mt-5 inline-flex items-center text-sm font-medium text-foreground/80 group-hover:text-foreground">
                    {isActive ? "Open" : "Planned"}{" "}
                    <span
                      aria-hidden
                      className="ml-1 transition-transform group-hover:translate-x-0.5"
                    >
                      -&gt;
                    </span>
                  </span>
                </div>
              </a>
            );
          })}
        </section>

        <section className="mt-14">
          <div className="mb-5 flex items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground">Partner Tools</h2>
            <div className="h-px flex-1 bg-border/60" />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {partnerTools.map((tool) => (
              <a
                key={tool.id}
                href={tool.href}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-3 rounded-xl border border-border bg-card/70 p-4 transition hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-card hover:shadow-md"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-border/60 bg-background">
                  <img
                    src={tool.logoUrl}
                    alt={`${tool.name} logo`}
                    loading="lazy"
                    className="h-6 w-6"
                    referrerPolicy="no-referrer"
                  />
                </span>
                <span className="text-sm font-medium text-foreground/90 group-hover:text-foreground">
                  {tool.name}
                </span>
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    subscribeToAuthState((nextUser) => {
      setUser(nextUser);
      setIsLoading(false);
    })
      .then((unsubscribe) => {
        cleanup = unsubscribe;
      })
      .catch((error) => {
        if (import.meta.env.DEV) console.error(error);
        setAuthError(error instanceof Error ? error.message : "Authentication failed.");
        setIsLoading(false);
      });

    return () => {
      cleanup?.();
    };
  }, []);

  const handleLogin = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (error) {
      if (import.meta.env.DEV) console.error(error);
      setAuthError(error instanceof Error ? error.message : "Unable to sign in.");
    }
  };

  const handleLogout = async () => {
    setAuthError(null);
    try {
      await signOutUser();
      setUser(null);
    } catch (error) {
      if (import.meta.env.DEV) console.error(error);
      setAuthError(error instanceof Error ? error.message : "Unable to sign out.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600" />
          <span className="text-sm">Connecting to Workspace SSO...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} error={authError} />;
  }

  if (pathname === "/admin/people" || pathname === "/admin/accounts") {
    const fallback = (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
      </div>
    );
    return (
      <Suspense fallback={fallback}>
        {pathname === "/admin/people"
          ? <AdminPeoplePage user={user} />
          : <AdminAccountsPage user={user} />}
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <LauncherShell user={user} />
      <div className="fixed bottom-6 right-6 flex items-center gap-2">
        {authError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {authError}
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-accent"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
