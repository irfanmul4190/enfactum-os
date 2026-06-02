import {
  BarChart3,
  BookOpen,
  Compass,
  FileBarChart,
  FileSignature,
  Languages,
  PiggyBank,
  Presentation,
  ReceiptText,
  Rocket,
  ScrollText,
  type LucideIcon,
} from "lucide-react";

type LauncherAppStatus = "active" | "planned";

export type LauncherApp = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  gradient: string;   // solid gradient for icon bg
  glow: string;       // rgba color for hover glow shadow
  status: LauncherAppStatus;
};

type AppUrlConfig = {
  envKey: string;
  localFallback: string;
  productionFallback: string;
};

const env = import.meta.env as Record<string, string | undefined>;

function resolveAppUrl({ envKey, localFallback, productionFallback }: AppUrlConfig) {
  const configuredUrl = env[envKey]?.trim();
  return configuredUrl || (import.meta.env.DEV ? localFallback : productionFallback);
}

// Ordering convention: actives first (in roughly the order they shipped),
// planned at the bottom. The launcher renders this list in order. The
// `sortActiveFirst` helper below enforces it at module load — if someone
// inserts a planned card between actives, the runtime fixes it back rather
// than relying on reviewer vigilance.
const sortActiveFirst = (apps: LauncherApp[]) =>
  [...apps].sort((a, b) => {
    if (a.status === b.status) return 0;
    return a.status === "active" ? -1 : 1;
  });

export const launcherApps: LauncherApp[] = sortActiveFirst([
  // ───────────── Active ─────────────
  {
    id: "market-grammer",
    title: "Market-Grammer",
    description: "Brand voice, messaging guidelines, and localized copy library for all markets.",
    href: resolveAppUrl({
      envKey: "VITE_MARKET_GRAMMER_URL",
      localFallback: "http://localhost:5174/market-grammer/",
      productionFallback: "/market-grammer/",
    }),
    icon: Languages,
    gradient: "from-cyan-500 to-teal-600",
    glow: "rgba(6,182,212,0.25)",
    status: "active",
  },
  {
    id: "pipeline-pro",
    title: "Pipeline Pro",
    description: "Pipeline-level analytics, KPI dashboards, and performance monitoring.",
    href: resolveAppUrl({
      envKey: "VITE_LAUNCHER_PIPELINE_PRO_URL",
      localFallback: "http://localhost:8080/pipeline-pro/",
      productionFallback: "/pipeline-pro/",
    }),
    icon: BarChart3,
    gradient: "from-indigo-500 to-violet-600",
    glow: "rgba(99,102,241,0.2)",
    status: "active",
  },
  {
    id: "profit-navigator",
    title: "Profit Navigator",
    description: "Track margins, forecasts, and profitability across all client accounts.",
    href: resolveAppUrl({
      envKey: "VITE_LAUNCHER_PROFIT_NAVIGATOR_URL",
      localFallback: "http://localhost:8081/profit-navigator/",
      productionFallback: "/profit-navigator/",
    }),
    icon: Compass,
    gradient: "from-violet-500 to-purple-600",
    glow: "rgba(139,92,246,0.2)",
    status: "active",
  },
  {
    id: "enfactum-financing-hub",
    title: "Financing Hub",
    description: "Manage invoices, track payments, and gain financial visibility across all client accounts.",
    href: resolveAppUrl({
      envKey: "VITE_LAUNCHER_FINANCING_HUB_URL",
      localFallback: "http://localhost:8082/enfactum-financing-hub/",
      productionFallback: "/enfactum-financing-hub/",
    }),
    icon: ReceiptText,
    gradient: "from-rose-500 to-pink-600",
    glow: "rgba(244,63,94,0.2)",
    status: "active",
  },
  {
    id: "notebook-lm",
    title: "Notebook LM",
    description: "AI-powered research notebooks for briefing docs, meeting notes, and knowledge capture.",
    // Links straight to Google's NotebookLM. An env override is still honored
    // if you ever self-host or want to point elsewhere.
    href: env.VITE_LAUNCHER_NOTEBOOK_LM_URL?.trim() || "https://notebooklm.google.com/notebook/347a143c-4ab9-4c55-9a80-da582ac67cbe",
    icon: BookOpen,
    gradient: "from-purple-500 to-violet-600",
    glow: "rgba(168,85,247,0.2)",
    status: "active",
  },
  {
    id: "hr-hub",
    title: "HR Hub",
    description: "Onboarding, team directory, leave management, and company announcements.",
    href: resolveAppUrl({
      envKey: "VITE_LAUNCHER_HR_HUB_URL",
      localFallback: "http://localhost:8083/hr-hub/",
      productionFallback: "/hr-hub/",
    }),
    icon: Rocket,
    gradient: "from-fuchsia-500 to-pink-600",
    glow: "rgba(217,70,239,0.2)",
    status: "active",
  },

  // ───────────── Planned ─────────────
  {
    id: "slide-maker",
    title: "Slide Maker",
    description: "Build polished client-ready presentations with Enfactum templates and brand assets.",
    href: resolveAppUrl({
      envKey: "VITE_LAUNCHER_SLIDE_MAKER_URL",
      localFallback: "#",
      productionFallback: "/slide-maker/",
    }),
    icon: Presentation,
    gradient: "from-orange-400 to-amber-500",
    glow: "rgba(251,146,60,0.2)",
    status: "planned",
  },
  {
    id: "proposal-builder",
    title: "Proposal Builder",
    description: "Draft, customise, and send winning proposals faster with AI-assisted templates.",
    href: resolveAppUrl({
      envKey: "VITE_LAUNCHER_PROPOSAL_BUILDER_URL",
      localFallback: "#",
      productionFallback: "/proposal-builder/",
    }),
    icon: ScrollText,
    gradient: "from-teal-500 to-cyan-600",
    glow: "rgba(20,184,166,0.2)",
    status: "planned",
  },
  {
    id: "reporting-pro",
    title: "Reporting Pro",
    description: "Generate client-ready performance reports with live data and one-click exports.",
    href: resolveAppUrl({
      envKey: "VITE_LAUNCHER_REPORTING_PRO_URL",
      localFallback: "#",
      productionFallback: "/reporting-pro/",
    }),
    icon: FileBarChart,
    gradient: "from-lime-500 to-green-600",
    glow: "rgba(132,204,22,0.2)",
    status: "planned",
  },
  {
    id: "enfactum-mdf-central",
    title: "MDF Central",
    description: "Manage market development funds, submissions, and partner claims.",
    href: resolveAppUrl({
      envKey: "VITE_LAUNCHER_MDF_CENTRAL_URL",
      localFallback: "#",
      productionFallback: "/enfactum-mdf-central/",
    }),
    icon: PiggyBank,
    gradient: "from-amber-500 to-orange-500",
    glow: "rgba(245,158,11,0.2)",
    status: "active",
  },
  {
    id: "enforge-contract-craft",
    title: "Enforge Contract Craft",
    description: "Draft, negotiate, and manage client contracts end-to-end.",
    href: resolveAppUrl({
      envKey: "VITE_LAUNCHER_ENFORGE_URL",
      localFallback: "http://localhost:8085/enforge-contract-craft/",
      productionFallback: "/enforge-contract-craft/",
    }),
    icon: FileSignature,
    gradient: "from-sky-500 to-blue-600",
    glow: "rgba(14,165,233,0.2)",
    status: "active",
  },
]);
