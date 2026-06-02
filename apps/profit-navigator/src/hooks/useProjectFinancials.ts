import { useMemo } from "react";
import { useDataStore } from "@/hooks/useDataStore";
import { useCurrency } from "@/hooks/useCurrency";
import { computeProjectFinancials } from "@/lib/calculations";
import type { ProjectFinancials } from "@/data/types";

export interface ProjectWithFinancials {
  project: ReturnType<typeof useDataStore>["projects"][0];
  client: ReturnType<typeof useDataStore>["clients"][0] | undefined;
  financials: ProjectFinancials;
}

export function useAllProjectFinancials(): ProjectWithFinancials[] {
  const { projects, clients, timesheets, vendorCosts, otherCosts, invoices, splits } = useDataStore();
  const { fxRates } = useCurrency();
  return useMemo(() => {
    return projects.map(p => {
      const pTimesheets = timesheets.filter(t => t.project_id === p.project_id);
      const pVendorCosts = vendorCosts.filter(v => v.project_id === p.project_id);
      const pOtherCosts = otherCosts.filter(o => o.project_id === p.project_id);
      const pInvoices = invoices.filter(i => i.project_id === p.project_id);
      const pSplits = splits.filter(s => s.project_id === p.project_id);
      const client = clients.find(c => c.client_id === p.client_id);
      // For non-SGD projects, convert SGD-denominated costs to project currency
      // SGD→ProjectCurrency rate = 1 / (ProjectCurrency→SGD rate)
      const cur = p.currency || "SGD";
      let sgdToProjectRate = 1;
      if (cur !== "SGD") {
        const curToSGD = fxRates[`${cur}_SGD`];
        if (curToSGD && curToSGD > 0) {
          sgdToProjectRate = 1 / curToSGD;
        }
      }
      const financials = computeProjectFinancials(p, pTimesheets, pVendorCosts, pOtherCosts, pInvoices, pSplits, sgdToProjectRate);
      return { project: p, client, financials };
    });
  }, [projects, clients, timesheets, vendorCosts, otherCosts, invoices, splits, fxRates]);
}

export function useProjectFinancials(projectId: string): ProjectWithFinancials | undefined {
  const all = useAllProjectFinancials();
  return all.find(p => p.project.project_id === projectId);
}
