import type { Project, ProjectStakeholderSplit, Timesheet, VendorCost, OtherCost, Invoice, ProjectFinancials, ComputedPayout } from "@/data/types";
import { stakeholders } from "@/data/seedData";

function computePayout(
  split: ProjectStakeholderSplit,
  revenueBase: number,
  marginBase: number
): ComputedPayout {
  const sh = stakeholders.find(s => s.stakeholder_id === split.stakeholder_id);
  let raw = 0;

  switch (split.payout_model) {
    case "PERCENT_OF_REVENUE":
      raw = revenueBase * (split.payout_value / 100);
      break;
    case "PERCENT_OF_GROSS_MARGIN":
      raw = marginBase * (split.payout_value / 100);
      break;
    case "FIXED_AMOUNT":
      raw = split.payout_value;
      break;
    case "NONE":
      raw = 0;
      break;
  }

  let capped = raw;
  switch (split.cap_type) {
    case "CAP_AMOUNT":
      capped = Math.min(raw, split.cap_value);
      break;
    case "CAP_PERCENT_OF_REVENUE":
      capped = Math.min(raw, revenueBase * (split.cap_value / 100));
      break;
    case "CAP_PERCENT_OF_GROSS_MARGIN":
      capped = Math.min(raw, marginBase * (split.cap_value / 100));
      break;
  }

  let floored = capped;
  switch (split.floor_type) {
    case "FLOOR_AMOUNT":
      floored = Math.max(capped, split.floor_value);
      break;
  }

  return {
    split_id: split.split_id,
    stakeholder_id: split.stakeholder_id,
    stakeholder_name: sh?.stakeholder_name ?? "Unknown",
    role_on_project: split.role_on_project,
    payout_model: split.payout_model,
    payout_value: split.payout_value,
    raw_amount: raw,
    capped_amount: capped,
    floored_amount: floored,
    final_amount: floored,
  };
}

/**
 * Compute project financials. All returned values are in the project's currency.
 * @param sgdToProjectRate - conversion rate from SGD to project currency (default 1 for SGD projects).
 *   Internal costs (timesheets) are always SGD-denominated; this rate converts them to project currency.
 */
export function computeProjectFinancials(
  project: Project,
  projectTimesheets: Timesheet[],
  projectVendorCosts: VendorCost[],
  projectOtherCosts: OtherCost[],
  projectInvoices: Invoice[],
  projectSplits: ProjectStakeholderSplit[],
  sgdToProjectRate: number = 1
): ProjectFinancials {
  const approved = projectTimesheets.filter(t => t.status === "Approved");

  // Helper: convert SGD-denominated amount to project currency
  const toPC = (sgdAmount: number) => sgdAmount * sgdToProjectRate;

  if (project.commercial_model === "PARTNER_PASS_THROUGH") {
    const partnerRevenue = project.partner_revenue_basis_ex_tax ?? 0;
    const flatFeePercent = project.flat_fee_percent ?? 0;
    const flatFeeAmount = partnerRevenue * (flatFeePercent / 100);
    const internalRechargeAmount = project.internal_recharge_applies
      ? toPC(approved.reduce((s, t) => s + t.recharge_amount, 0)) : 0;
    const enfactumNetRevenue = flatFeeAmount + internalRechargeAmount;
    const enfactumInternalCost = toPC(approved.reduce((s, t) => s + t.cost_amount, 0));
    const contributionMargin = enfactumNetRevenue - enfactumInternalCost;
    const partnerNetPayable = partnerRevenue - flatFeeAmount - internalRechargeAmount;

    const revenueBase = enfactumNetRevenue;
    const marginBase = contributionMargin;

    const payouts = projectSplits.map(sp => computePayout(sp, revenueBase, marginBase));
    const totalPayouts = payouts.reduce((s, p) => s + p.final_amount, 0);

    return {
      revenueUsed: enfactumNetRevenue,
      internalCost: enfactumInternalCost,
      vendorCost: 0,
      otherCost: 0,
      grossMargin: contributionMargin,
      grossMarginPct: enfactumNetRevenue > 0 ? contributionMargin / enfactumNetRevenue : 0,
      totalPayouts,
      netMarginAfterPayouts: contributionMargin - totalPayouts,
      payouts,
      partnerRevenue,
      flatFeeAmount,
      internalRechargeAmount,
      enfactumNetRevenue,
      enfactumInternalCost,
      contributionMargin,
      partnerNetPayable,
    };
  }

  // ENFACTUM_LED
  const invoiceTotal = projectInvoices.reduce((s, inv) => s + inv.amount_ex_tax, 0);
  const revenueUsed =
    project.revenue_recognition_basis === "Invoices (Actual)" && invoiceTotal > 0
      ? invoiceTotal
      : project.contracted_revenue_ex_tax;

  const internalCost = toPC(approved.reduce((s, t) => s + t.cost_amount, 0));
  const vendorCost = toPC(projectVendorCosts.reduce((s, v) => s + v.actual_amount, 0));
  const otherCost = toPC(projectOtherCosts.reduce((s, o) => s + o.actual_amount, 0));
  const grossMargin = revenueUsed - internalCost - vendorCost - otherCost;
  const grossMarginPct = revenueUsed > 0 ? grossMargin / revenueUsed : 0;

  const payouts = projectSplits.map(sp => computePayout(sp, revenueUsed, grossMargin));
  const totalPayouts = payouts.reduce((s, p) => s + p.final_amount, 0);

  return {
    revenueUsed,
    internalCost,
    vendorCost,
    otherCost,
    grossMargin,
    grossMarginPct,
    totalPayouts,
    netMarginAfterPayouts: grossMargin - totalPayouts,
    payouts,
  };
}
