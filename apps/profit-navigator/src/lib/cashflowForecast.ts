import { addMonths, differenceInMonths, format, parseISO, startOfMonth, isAfter, isBefore, endOfMonth } from "date-fns";
import type { Invoice, VendorCost, Project } from "@/data/types";
import type { ProjectWithFinancials } from "@/hooks/useProjectFinancials";

export interface ForecastMonth {
  monthKey: string;        // yyyy-MM
  label: string;           // "MMM yyyy"
  forecastInflows: number;
  forecastOutflows: number;
}

/**
 * Generate cashflow forecast months beyond the last actual data month.
 *
 * Inflows: remaining contracted revenue (contracted - invoiced) spread evenly
 *          across remaining project months.
 * Outflows: average monthly vendor cost rate projected forward.
 */
export function generateCashflowForecast(
  projects: ProjectWithFinancials[],
  invoices: Invoice[],
  vendorCosts: VendorCost[],
  forecastMonths: number = 3,
): ForecastMonth[] {
  const today = new Date();
  const currentMonth = startOfMonth(today);

  // Determine the start month for forecasting (month after current)
  const forecastStart = addMonths(currentMonth, 1);

  // Per-month accumulators
  const monthMap: Record<string, { inflows: number; outflows: number }> = {};

  projects.forEach(({ project }) => {
    const pid = project.project_id;
    const projEnd = project.end_date ? parseISO(project.end_date) : addMonths(today, 6);
    if (isBefore(projEnd, forecastStart)) return; // project already ended

    // --- Inflow forecast ---
    if (project.commercial_model !== "PARTNER_PASS_THROUGH" && project.contracted_revenue_ex_tax > 0) {
      const invoicedTotal = invoices
        .filter(inv => inv.project_id === pid)
        .reduce((sum, inv) => sum + inv.amount_ex_tax, 0);

      const remaining = Math.max(0, project.contracted_revenue_ex_tax - invoicedTotal);
      if (remaining > 0) {
        const remainingMonthsCount = Math.max(1, differenceInMonths(endOfMonth(projEnd), forecastStart) + 1);
        const cappedMonths = Math.min(remainingMonthsCount, forecastMonths);
        const perMonth = remaining / remainingMonthsCount;

        for (let i = 0; i < cappedMonths; i++) {
          const m = format(addMonths(forecastStart, i), "yyyy-MM");
          if (!monthMap[m]) monthMap[m] = { inflows: 0, outflows: 0 };
          monthMap[m].inflows += perMonth;
        }
      }
    }

    // --- Outflow forecast (avg monthly vendor cost) ---
    const projVendorCosts = vendorCosts.filter(vc => vc.project_id === pid);
    if (projVendorCosts.length > 0) {
      // Group by month to find average monthly spend
      const vcMonths: Record<string, number> = {};
      projVendorCosts.forEach(vc => {
        const d = vc.invoice_date || project.start_date;
        const mk = format(startOfMonth(parseISO(d)), "yyyy-MM");
        vcMonths[mk] = (vcMonths[mk] || 0) + vc.actual_amount;
      });
      const monthKeys = Object.keys(vcMonths);
      const avgMonthly = monthKeys.length > 0
        ? monthKeys.reduce((s, k) => s + vcMonths[k], 0) / monthKeys.length
        : 0;

      if (avgMonthly > 0) {
        const remainingMonthsCount = Math.max(1, differenceInMonths(endOfMonth(projEnd), forecastStart) + 1);
        const cappedMonths = Math.min(remainingMonthsCount, forecastMonths);
        for (let i = 0; i < cappedMonths; i++) {
          const m = format(addMonths(forecastStart, i), "yyyy-MM");
          if (!monthMap[m]) monthMap[m] = { inflows: 0, outflows: 0 };
          monthMap[m].outflows += avgMonthly;
        }
      }
    }
  });

  return Object.keys(monthMap)
    .sort()
    .slice(0, forecastMonths)
    .map(mk => ({
      monthKey: mk,
      label: format(parseISO(mk + "-01"), "MMM yyyy"),
      forecastInflows: Math.round(monthMap[mk].inflows),
      forecastOutflows: Math.round(monthMap[mk].outflows),
    }));
}
