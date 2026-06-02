/**
 * Client Health Score — pure scoring functions.
 * Score 0-100 based on: payment velocity (30), margin trend (30),
 * revenue growth (20), recurrence (20).
 */

import type { Client, Invoice, Project } from "@/data/types";
import type { ProjectWithFinancials } from "@/hooks/useProjectFinancials";
import { differenceInDays, parseISO } from "date-fns";

export type HealthTier = "Healthy" | "Stable" | "At Risk";

export interface ClientHealthResult {
  clientId: string;
  clientName: string;
  score: number;
  tier: HealthTier;
  breakdown: {
    paymentVelocity: number;   // 0-30
    marginTrend: number;       // 0-30
    revenueGrowth: number;     // 0-20
    recurrence: number;        // 0-20
  };
}

export function getTier(score: number): HealthTier {
  if (score >= 71) return "Healthy";
  if (score >= 41) return "Stable";
  return "At Risk";
}

export function getTierColor(tier: HealthTier): string {
  switch (tier) {
    case "Healthy": return "hsl(var(--positive))";
    case "Stable": return "hsl(var(--warning))";
    case "At Risk": return "hsl(var(--negative))";
  }
}

// ─── Sub-scores ──────────────────────────────────────────────────

/** Payment velocity: 30pts. Avg days-to-pay → score. ≤15d = 30, ≥90d = 0 */
function scorePaymentVelocity(invoices: Invoice[]): number {
  const paid = invoices.filter(i => i.status.toLowerCase() === "paid" && i.paid_date);
  if (paid.length === 0) return 15; // neutral if no paid invoices

  const avgDays = paid.reduce((sum, inv) => {
    const due = parseISO(inv.invoice_date);
    const paidDate = parseISO(inv.paid_date!);
    return sum + Math.max(0, differenceInDays(paidDate, due));
  }, 0) / paid.length;

  // Linear scale: 0 days → 30pts, 90+ days → 0pts
  const score = Math.max(0, 30 - (avgDays / 90) * 30);
  return Math.round(score);
}

/** Margin trend: 30pts. Compare GM% of newer projects vs older ones. */
function scoreMarginTrend(projectData: ProjectWithFinancials[]): number {
  if (projectData.length < 1) return 15; // neutral

  // Sort by start_date ascending
  const sorted = [...projectData].sort(
    (a, b) => a.project.start_date.localeCompare(b.project.start_date)
  );

  if (sorted.length === 1) {
    // Single project: score based on absolute margin
    const gm = sorted[0].financials.grossMarginPct;
    return Math.round(Math.min(30, Math.max(0, gm * 30 / 0.5))); // 50%+ GM = full marks
  }

  // Compare first half vs second half average GM%
  const mid = Math.floor(sorted.length / 2);
  const olderAvg = sorted.slice(0, mid).reduce((s, d) => s + d.financials.grossMarginPct, 0) / mid;
  const newerAvg = sorted.slice(mid).reduce((s, d) => s + d.financials.grossMarginPct, 0) / (sorted.length - mid);

  const improvement = newerAvg - olderAvg;
  // -20pp or worse → 0, +10pp or better → 30, linear between
  const score = Math.max(0, Math.min(30, ((improvement + 0.20) / 0.30) * 30));
  return Math.round(score);
}

/** Revenue growth: 20pts. Is revenue per project growing over time? */
function scoreRevenueGrowth(projectData: ProjectWithFinancials[]): number {
  if (projectData.length < 2) return 10; // neutral

  const sorted = [...projectData].sort(
    (a, b) => a.project.start_date.localeCompare(b.project.start_date)
  );

  const mid = Math.floor(sorted.length / 2);
  const olderAvgRev = sorted.slice(0, mid).reduce((s, d) => s + d.financials.revenueUsed, 0) / mid;
  const newerAvgRev = sorted.slice(mid).reduce((s, d) => s + d.financials.revenueUsed, 0) / (sorted.length - mid);

  if (olderAvgRev <= 0) return 10;

  const growthPct = (newerAvgRev - olderAvgRev) / olderAvgRev;
  // -50% or worse → 0, +50% or better → 20, linear between
  const score = Math.max(0, Math.min(20, ((growthPct + 0.5) / 1.0) * 20));
  return Math.round(score);
}

/** Recurrence: 20pts. More projects = better loyalty, capped at 5. */
function scoreRecurrence(projectCount: number): number {
  return Math.round(Math.min(20, (projectCount / 5) * 20));
}

// ─── Master function ─────────────────────────────────────────────

export function calculateClientHealthScore(
  client: Client,
  projectData: ProjectWithFinancials[],
  invoices: Invoice[],
): ClientHealthResult {
  const clientInvoices = invoices.filter(i =>
    projectData.some(d => d.project.project_id === i.project_id)
  );

  const paymentVelocity = scorePaymentVelocity(clientInvoices);
  const marginTrend = scoreMarginTrend(projectData);
  const revenueGrowth = scoreRevenueGrowth(projectData);
  const recurrence = scoreRecurrence(projectData.length);

  const score = paymentVelocity + marginTrend + revenueGrowth + recurrence;

  return {
    clientId: client.client_id,
    clientName: client.client_name,
    score,
    tier: getTier(score),
    breakdown: { paymentVelocity, marginTrend, revenueGrowth, recurrence },
  };
}

/** Batch compute health for all clients. */
export function calculateAllClientHealth(
  clients: Client[],
  allProjectData: ProjectWithFinancials[],
  invoices: Invoice[],
): ClientHealthResult[] {
  return clients.map(c => {
    const clientProjects = allProjectData.filter(d => d.project.client_id === c.client_id);
    return calculateClientHealthScore(c, clientProjects, invoices);
  }).sort((a, b) => b.score - a.score);
}
