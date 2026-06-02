import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Moon, Sun, ArrowUpRight, ExternalLink } from "lucide-react";
import { launcherApps, type LauncherApp } from "@/lib/app-urls";
import { subscribeToAuthState, type AuthUser } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Enfactum OS" },
      { name: "description", content: "Enfactum internal tools — your workplace hub." },
    ],
  }),
  component: Index,
});

function useAuthState() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    subscribeToAuthState((authUser) => {
      if (!cancelled) {
        setUser(authUser);
        setLoading(false);
      }
    }).then((unsub) => {
      if (cancelled) unsub();
      else unsubscribe = unsub;
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  return { user, loading };
}

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
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-card/60 text-muted-foreground backdrop-blur-sm transition-all hover:border-border hover:text-foreground"
    >
      {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
    </button>
  );
}

function LiveCard({ app }: Readonly<{ app: LauncherApp }>) {
  const Icon = app.icon;
  return (
    <a
      href={app.href}
      className="group relative flex flex-col sm:flex-row sm:items-center gap-5 overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-7 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
      style={{
        ["--glow" as string]: app.glow,
      }}
    >
      {/* Top gradient line */}
      <div
        className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent`}
        style={{ background: `linear-gradient(to right, transparent, ${app.glow.replace("0.25", "0.8")}, transparent)` }}
      />

      {/* Subtle background tint */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `radial-gradient(ellipse at top left, ${app.glow.replace("0.25", "0.08")}, transparent 60%)` }}
      />

      {/* Icon */}
      <div
        className={`relative shrink-0 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${app.gradient} shadow-lg transition-transform duration-300 group-hover:scale-105`}
      >
        <Icon className="h-7 w-7 text-white" />
      </div>

      {/* Text */}
      <div className="relative flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-emerald-500">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            <span>Live</span>
          </span>
        </div>
        <h2 className="text-lg font-bold tracking-tight text-card-foreground">{app.title}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{app.description}</p>
      </div>

      {/* CTA */}
      <div className="relative shrink-0">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/60 px-4 py-2 text-sm font-semibold text-foreground backdrop-blur-sm transition-all duration-200 group-hover:border-foreground/30 group-hover:bg-background/80">
          Open
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </a>
  );
}

function PlannedCard({ app }: Readonly<{ app: LauncherApp }>) {
  const Icon = app.icon;
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border/40 bg-card/40 p-5 backdrop-blur-sm transition-all duration-200">
      {/* Icon */}
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${app.gradient} opacity-80 transition-opacity duration-200 group-hover:opacity-100`}
      >
        <Icon className="h-5 w-5 text-white" />
      </div>

      <h3 className="mt-4 text-[13px] font-semibold text-card-foreground">{app.title}</h3>
      <p className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground/80">
        {app.description}
      </p>

      <div className="mt-4 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/50">
        <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
        <span>Coming soon</span>
      </div>
    </div>
  );
}

type PartnerTool = {
  id: string;
  name: string;
  href: string;
  gradient: string;
  label: string;
};

const partnerTools: PartnerTool[] = [
  { id: "mavic-ai",   name: "Mavic AI",               href: "https://www.mavic.ai",                  gradient: "from-blue-500 to-cyan-500",       label: "Mv" },
  { id: "addlly",     name: "Addlly",                  href: "https://addlly.ai",                     gradient: "from-violet-600 to-purple-600",   label: "Ad" },
  { id: "canva",      name: "Canva",                   href: "https://www.canva.com",                 gradient: "from-purple-500 to-fuchsia-500",  label: "Cv" },
  { id: "adobe-cc",   name: "Adobe Creative Cloud",    href: "https://creativecloud.adobe.com",       gradient: "from-red-500 to-red-600",         label: "Cc" },
  { id: "sprouts-ai", name: "Sprouts AI",              href: "https://www.sprouts.ai",                gradient: "from-emerald-500 to-teal-500",    label: "Sp" },
  { id: "claude",     name: "Claude",                  href: "https://claude.ai",                     gradient: "from-amber-500 to-orange-500",    label: "Cl" },
  { id: "gemini",     name: "Gemini Pro",              href: "https://gemini.google.com",             gradient: "from-blue-400 to-indigo-500",     label: "Gm" },
  { id: "chatgpt",    name: "Chat GPT",                href: "https://chatgpt.com",                   gradient: "from-emerald-600 to-teal-600",    label: "AI" },
];

function PartnerCard({ tool }: Readonly<{ tool: PartnerTool }>) {
  return (
    <a
      href={tool.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col items-center gap-2.5 rounded-2xl border border-border/40 bg-card/40 p-4 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-border/70 hover:bg-card/60 hover:shadow-lg"
    >
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${tool.gradient} shadow-sm transition-transform duration-200 group-hover:scale-105`}>
        <span className="text-xs font-black tracking-wide text-white">{tool.label}</span>
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-center text-[11px] font-semibold leading-tight text-card-foreground">
          {tool.name}
        </span>
        <ExternalLink className="h-2.5 w-2.5 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground/70" />
      </div>
    </a>
  );
}

function Index() {
  const { user, loading } = useAuthState();
  const navigate = useNavigate();
  const activeApps = launcherApps.filter((a) => a.status === "active");
  const plannedApps = launcherApps.filter((a) => a.status === "planned");

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <svg className="h-6 w-6 animate-spin text-muted-foreground" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="relative min-h-screen bg-background">
      {/* Background gradient orbs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -right-48 -top-48 h-[700px] w-[700px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, oklch(0.55 0.18 280 / 0.12) 0%, transparent 65%)",
          }}
        />
        <div
          className="absolute -bottom-48 -left-48 h-[500px] w-[500px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, oklch(0.55 0.18 240 / 0.08) 0%, transparent 65%)",
          }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm">
              <span className="text-[11px] font-black text-white tracking-tight">E</span>
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-foreground">Enfactum OS</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground/60 sm:block">{today}</span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-14">
        {/* Hero */}
        <section className="mb-12">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-muted-foreground/40" />
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">
              Enfactum OS
            </span>
          </div>
          <h1 className="text-5xl font-black tracking-tight text-foreground sm:text-6xl">
            Elevating Our Workflow
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground leading-relaxed">
            We're building a smarter intranet to help you focus on what you do best. This launcher connects
            you to our evolving library of AI tools for smoother tracking and faster proposals.
          </p>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground leading-relaxed">
            We're polishing the more apps and will be dropping them into your dashboard shortly.
          </p>
        </section>

        {/* Live apps */}
        {activeApps.length > 0 && (
          <section className="mb-10 space-y-3">
            {activeApps.map((app) => (
              <LiveCard key={app.id} app={app} />
            ))}
          </section>
        )}

        {/* Planned apps */}
        {plannedApps.length > 0 && (
          <section>
            <div className="mb-5 flex items-center gap-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">
                In the pipeline
              </span>
              <div className="h-px flex-1 bg-border/40" />
              <span className="text-[11px] text-muted-foreground/40">{plannedApps.length} apps</span>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {plannedApps.map((app) => (
                <PlannedCard key={app.id} app={app} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Partner Tools */}
      <section className="mx-auto max-w-5xl px-6 pb-14">
        <div className="mb-5 flex items-center gap-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">
            Partner Tools
          </span>
          <div className="h-px flex-1 bg-border/40" />
        </div>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
          {partnerTools.map((tool) => (
            <PartnerCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-5 text-center">
        <p className="text-[11px] text-muted-foreground/40 tracking-wider">
          ENFACTUM OS · v1.0 · PHASE 1
        </p>
      </footer>
    </div>
  );
}
