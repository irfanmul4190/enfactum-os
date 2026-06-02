/**
 * Pure financial utility functions.
 * All business logic is centralised here to avoid inline calculations in components.
 * The heavy-lifting engine (computeProjectFinancials / computePayout) stays in
 * src/lib/calculations.ts — this module provides lightweight helpers that wrap,
 * aggregate, or normalise its outputs.
 */

import type { ProjectFinancials } from "@/data/types";
import type { ProjectWithFinancials } from "@/hooks/useProjectFinancials";

// ─── Margin helpers ──────────────────────────────────────────────

/** Safe gross-margin percentage (0 when revenue is 0). */
export function calculateGrossMarginPct(revenue: number, grossMargin: number): number {
  return revenue > 0 ? grossMargin / revenue : 0;
}

/** Gross margin = revenue − all costs. Pure convenience wrapper. */
export function calculateGrossMargin(revenue: number, internalCost: number, vendorCost: number, otherCost: number): number {
  return revenue - internalCost - vendorCost - otherCost;
}

/** Net margin = grossMargin − payouts. */
export function calculateNetMargin(grossMargin: number, totalPayouts: number): number {
  return grossMargin - totalPayouts;
}

// ─── Currency normalisation ──────────────────────────────────────

/** Convert an amount from `currency` to SGD using the supplied conversion fn. */
export function normalizeToSGD(
  amount: number,
  currency: string,
  toSGD: (amount: number, cur: string) => number,
): number {
  return toSGD(amount, currency);
}

// ─── Portfolio aggregation ───────────────────────────────────────

export interface PortfolioTotals {
  revenue: number;
  grossMargin: number;
  netMargin: number;
  totalPayouts: number;
  internalCost: number;
  vendorCost: number;
  otherCost: number;
}

const EMPTY_TOTALS: PortfolioTotals = {
  revenue: 0,
  grossMargin: 0,
  netMargin: 0,
  totalPayouts: 0,
  internalCost: 0,
  vendorCost: 0,
  otherCost: 0,
};

/**
 * Aggregate financials across many projects.
 * Optionally normalise each project's values to SGD via `toSGD`.
 */
export function aggregatePortfolioTotals(
  data: ProjectWithFinancials[],
  toSGD?: (amount: number, currency: string) => number,
): PortfolioTotals {
  return data.reduce<PortfolioTotals>((acc, d) => {
    const cur = d.project.currency || "SGD";
    const norm = toSGD ? (v: number) => toSGD(v, cur) : (v: number) => v;
    return {
      revenue: acc.revenue + norm(d.financials.revenueUsed),
      grossMargin: acc.grossMargin + norm(d.financials.grossMargin),
      netMargin: acc.netMargin + norm(d.financials.netMarginAfterPayouts),
      totalPayouts: acc.totalPayouts + norm(d.financials.totalPayouts),
      internalCost: acc.internalCost + norm(d.financials.internalCost),
      vendorCost: acc.vendorCost + norm(d.financials.vendorCost),
      otherCost: acc.otherCost + norm(d.financials.otherCost),
    };
  }, { ...EMPTY_TOTALS });
}

/**
 * Aggregate raw totals (no currency conversion) — used by AnalyticsPage
 * where all projects are already in their own currency and charts show
 * per-project amounts.
 */
export function aggregateRawTotals(data: ProjectWithFinancials[]): PortfolioTotals {
  return aggregatePortfolioTotals(data);
}

// ─── Date-range filtering ────────────────────────────────────────

/** Filter projects whose [start_date, end_date] overlaps [from, to]. */
export function filterByDateRange(
  data: ProjectWithFinancials[],
  dateFrom: Date | undefined,
  dateTo: Date | undefined,
): ProjectWithFinancials[] {
  if (!dateFrom && !dateTo) return data;
  return data.filter(d => {
    const pStart = new Date(d.project.start_date);
    const pEnd = new Date(d.project.end_date);
    if (dateFrom && pEnd < dateFrom) return false;
    if (dateTo && pStart > dateTo) return false;
    return true;
  });
}

// ─── Guardrail checks ────────────────────────────────────────────

/** Returns true when payouts exceed 40% of Enfactum Net Revenue (pass-through guardrail). */
export function isPayoutGuardrailTriggered(financials: ProjectFinancials, isPassThrough: boolean): boolean {
  if (!isPassThrough || !financials.enfactumNetRevenue) return false;
  return financials.totalPayouts > 0.4 * financials.enfactumNetRevenue;
}

/** Returns true when GM% is below the project's target. */
export function isGrossMarginBelowTarget(gmPct: number, targetPercent: number): boolean {
  return gmPct < targetPercent / 100;
}
