import { Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Dashboard } from "@/pages/Dashboard";
import { InvoiceTracker } from "@/pages/InvoiceTracker";
import { RevenueAnalysis } from "@/pages/RevenueAnalysis";
import { TargetsGrowth } from "@/pages/TargetsGrowth";
import { AccountLeads } from "@/pages/AccountLeads";
import { MonthlyClose } from "@/pages/MonthlyClose";
import { Analytics } from "@/pages/Analytics";
import { InvoiceEntry } from "@/pages/InvoiceEntry";
import { GSTReport } from "@/pages/GSTReport";

// Page id ↔ URL path. Sidebar still talks in ids (e.g. "dashboard") via its
// `active` and `onNavigate` props; this map keeps the legacy interface while
// the rest of the world (browser back, bookmarks, share-this-link) operates
// on URLs.
const PAGE_TO_PATH: Record<string, string> = {
  dashboard: "/",
  invoices:  "/invoices",
  entry:     "/entry",
  gst:       "/gst",
  revenue:   "/revenue",
  targets:   "/targets",
  accounts:  "/accounts",
  analytics: "/analytics",
  close:     "/close",
};

const PATH_TO_PAGE: Record<string, string> = Object.fromEntries(
  Object.entries(PAGE_TO_PATH).map(([page, path]) => [path, page]),
);

export default function Index() {
  const location = useLocation();
  const navigate = useNavigate();

  // Strip trailing slash so /invoices/ and /invoices both resolve.
  const path = location.pathname.replace(/\/+$/, "") || "/";
  const active = PATH_TO_PAGE[path] ?? "dashboard";

  const onNavigate = (id: string) => {
    const next = PAGE_TO_PATH[id] ?? "/";
    navigate(next);
  };

  return (
    <div className="flex min-h-screen" style={{ background: "hsl(var(--background))" }}>
      <Sidebar active={active} onNavigate={onNavigate} />
      <main className="ml-60 flex-1 p-6 xl:p-8 max-w-[1400px]">
        <Routes>
          <Route path="/"          element={<Dashboard />} />
          <Route path="/invoices"  element={<InvoiceTracker onNavigate={onNavigate} />} />
          <Route path="/entry"     element={<InvoiceEntry />} />
          <Route path="/gst"       element={<GSTReport />} />
          <Route path="/revenue"   element={<RevenueAnalysis />} />
          <Route path="/targets"   element={<TargetsGrowth />} />
          <Route path="/accounts"  element={<AccountLeads />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/close"     element={<MonthlyClose />} />
          {/* Unknown sub-paths fall back to dashboard. ThemeComparator (the
              dev split-screen theme tool) was removed from production render
              2026-05-19 — it was a Lovable artifact. */}
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
