/**
 * Proactive anomaly detection across the project portfolio.
 * All functions are pure — no side effects, no hooks.
 */

import type { Project, Invoice, VendorCost, Timesheet } from "@/data/types";
import type { ProjectWithFinancials } from "@/hooks/useProjectFinancials";
import { parseISO, differenceInDays, startOfMonth, format } from "date-fns";

export type AnomalySeverity = "high" | "medium" | "low";

export type AnomalyType =
  | "MARGIN_DROP"
  | "INVOICE_OVERDUE"
  | "GUARDRAIL_BREACH"
  | "COST_SPIKE"
  | "BUDGET_OVERRUN";

export interface Anomaly {
  type: AnomalyType;
  severity: AnomalySeverity;
  projectId: string;
  projectName: string;
  message: string;
  value: number;
}

// ─── Individual detectors ────────────────────────────────────────

/** 1. MARGIN_DROP: GM% dropped > 5pp from the project's target */
function detectMarginDrops(data: ProjectWithFinancials[]): Anomaly[] {
  return data.flatMap(({ project, financials }) => {
    const targetPct = project.margin_target_percent / 100;
    const currentPct = financials.grossMarginPct;
    const drop = targetPct - currentPct;
    if (drop > 0.05) {
      return [{
        type: "MARGIN_DROP" as const,
        severity: drop > 0.15 ? "high" as const : drop > 0.10 ? "medium" as const : "low" as const,
        projectId: project.project_id,
        projectName: project.project_name,
        message: `Gross margin (${(currentPct * 100).toFixed(1)}%) is ${(drop * 100).toFixed(1)}pp below target (${(targetPct * 100).toFixed(1)}%)`,
        value: drop,
      }];
    }
    return [];
  });
}

/** 2. INVOICE_OVERDUE: Unpaid invoices > 30 days past due date */
function detectOverdueInvoices(
  invoices: Invoice[],
  projects: Project[],
): Anomaly[] {
  const today = new Date();
  const projectMap = new Map(projects.map(p => [p.project_id, p]));

  return invoices.flatMap(inv => {
    if (inv.status.toLowerCase() === "paid") return [];
    const dueDate = parseISO(inv.invoice_date);
    const daysOverdue = differenceInDays(today, dueDate);
    if (daysOverdue > 30) {
      const proj = projectMap.get(inv.project_id);
      return [{
        type: "INVOICE_OVERDUE" as const,
        severity: daysOverdue > 90 ? "high" as const : daysOverdue > 60 ? "medium" as const : "low" as const,
        projectId: inv.project_id,
        projectName: proj?.project_name ?? "Unknown",
        message: `Invoice ${inv.invoice_no} is ${daysOverdue} days overdue (${inv.status})`,
        value: daysOverdue,
      }];
    }
    return [];
  });
}

/** 3. GUARDRAIL_BREACH: Total payouts > 40% of net revenue */
function detectGuardrailBreaches(data: ProjectWithFinancials[]): Anomaly[] {
  return data.flatMap(({ project, financials }) => {
    const revenue = financials.revenueUsed;
    if (revenue <= 0) return [];
    const payoutRatio = financials.totalPayouts / revenue;
    if (payoutRatio > 0.4) {
      return [{
        type: "GUARDRAIL_BREACH" as const,
        severity: payoutRatio > 0.6 ? "high" as const : "medium" as const,
        projectId: project.project_id,
        projectName: project.project_name,
        message: `Payout ratio is ${(payoutRatio * 100).toFixed(1)}% of revenue (exceeds 40% guardrail)`,
        value: payoutRatio,
      }];
    }
    return [];
  });
}

/** 4. COST_SPIKE: Latest month vendor costs > 120% of project average */
function detectCostSpikes(
  vendorCosts: VendorCost[],
  projects: Project[],
): Anomaly[] {
  const projectMap = new Map(projects.map(p => [p.project_id, p]));
  const byProject: Record<string, VendorCost[]> = {};
  vendorCosts.forEach(vc => {
    (byProject[vc.project_id] ??= []).push(vc);
  });

  return Object.entries(byProject).flatMap(([pid, costs]) => {
    // Group by month
    const monthlyTotals: Record<string, number> = {};
    costs.forEach(vc => {
      const date = vc.invoice_date || "2025-01-01";
      const monthKey = format(startOfMonth(parseISO(date)), "yyyy-MM");
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] ?? 0) + vc.actual_amount;
    });

    const months = Object.keys(monthlyTotals).sort();
    if (months.length < 2) return [];

    const latestMonth = months[months.length - 1];
    const latestTotal = monthlyTotals[latestMonth];
    const priorMonths = months.slice(0, -1);
    const avgPrior = priorMonths.reduce((s, m) => s + monthlyTotals[m], 0) / priorMonths.length;

    if (avgPrior > 0 && latestTotal > avgPrior * 1.2) {
      const ratio = latestTotal / avgPrior;
      const proj = projectMap.get(pid);
      return [{
        type: "COST_SPIKE" as const,
        severity: ratio > 2 ? "high" as const : ratio > 1.5 ? "medium" as const : "low" as const,
        projectId: pid,
        projectName: proj?.project_name ?? "Unknown",
        message: `Vendor costs in ${latestMonth} are ${((ratio - 1) * 100).toFixed(0)}% above the monthly average`,
        value: ratio,
      }];
    }
    return [];
  });
}

/** 5. BUDGET_OVERRUN: Total timesheet hours exceed contracted budget proxy */
function detectBudgetOverruns(
  timesheets: Timesheet[],
  projects: Project[],
): Anomaly[] {
  const projectMap = new Map(projects.map(p => [p.project_id, p]));
  const hoursByProject: Record<string, number> = {};
  timesheets.forEach(t => {
    hoursByProject[t.project_id] = (hoursByProject[t.project_id] ?? 0) + t.hours;
  });

  return Object.entries(hoursByProject).flatMap(([pid, totalHours]) => {
    const proj = projectMap.get(pid);
    if (!proj) return [];
    // Use contracted revenue / avg recharge rate as budget hour proxy
    // If actual cost exceeds revenue, it's an overrun signal
    const revenue = proj.contracted_revenue_ex_tax;
    if (revenue <= 0) return [];

    // Simple heuristic: if cost_amount (from timesheets) > 90% of contracted revenue
    // we flag it as a budget concern
    const totalCost = timesheets
      .filter(t => t.project_id === pid)
      .reduce((s, t) => s + t.cost_amount, 0);

    const ratio = totalCost / revenue;
    if (ratio > 0.9) {
      return [{
        type: "BUDGET_OVERRUN" as const,
        severity: ratio > 1.0 ? "high" as const : "medium" as const,
        projectId: pid,
        projectName: proj.project_name,
        message: `Internal costs are ${(ratio * 100).toFixed(0)}% of contracted revenue (${totalHours.toFixed(0)}h logged)`,
        value: ratio,
      }];
    }
    return [];
  });
}

// ─── Master detector ─────────────────────────────────────────────

const SEVERITY_ORDER: Record<AnomalySeverity, number> = { high: 0, medium: 1, low: 2 };

export function detectAllAnomalies(
  data: ProjectWithFinancials[],
  invoices: Invoice[],
  vendorCosts: VendorCost[],
  timesheets: Timesheet[],
): Anomaly[] {
  const projects = data.map(d => d.project);

  const anomalies = [
    ...detectMarginDrops(data),
    ...detectOverdueInvoices(invoices, projects),
    ...detectGuardrailBreaches(data),
    ...detectCostSpikes(vendorCosts, projects),
    ...detectBudgetOverruns(timesheets, projects),
  ];

  return anomalies.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}
