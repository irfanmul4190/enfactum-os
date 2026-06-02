import { describe, it, expect } from "vitest";
import {
  calculateGrossMarginPct,
  calculateGrossMargin,
  calculateNetMargin,
  normalizeToSGD,
  aggregatePortfolioTotals,
  aggregateRawTotals,
  filterByDateRange,
  isPayoutGuardrailTriggered,
  isGrossMarginBelowTarget,
} from "@/lib/financials";
import type { ProjectFinancials } from "@/data/types";
import type { ProjectWithFinancials } from "@/hooks/useProjectFinancials";

// ─── Helpers ─────────────────────────────────────────────────────

function makeProjectData(
  overrides: Partial<{
    currency: string;
    start_date: string;
    end_date: string;
    revenueUsed: number;
    grossMargin: number;
    netMarginAfterPayouts: number;
    totalPayouts: number;
    internalCost: number;
    vendorCost: number;
    otherCost: number;
    enfactumNetRevenue: number;
  }> = {},
): ProjectWithFinancials {
  return {
    project: {
      project_id: "p1",
      client_id: "c1",
      project_name: "Test",
      project_code: "T-001",
      country_of_delivery: "Singapore",
      currency: overrides.currency ?? "SGD",
      start_date: overrides.start_date ?? "2025-01-01",
      end_date: overrides.end_date ?? "2025-06-30",
      status: "ACTIVE",
      business_type: "Consulting",
      commercial_model: "ENFACTUM_LED",
      invoice_model: "Fixed Fee",
      revenue_recognition_basis: "Invoice",
      contracted_revenue_ex_tax: 100000,
      margin_target_percent: 40,
      approvals_status: "Approved",
    } as any,
    client: undefined,
    financials: {
      revenueUsed: overrides.revenueUsed ?? 100000,
      internalCost: overrides.internalCost ?? 20000,
      vendorCost: overrides.vendorCost ?? 10000,
      otherCost: overrides.otherCost ?? 5000,
      grossMargin: overrides.grossMargin ?? 65000,
      grossMarginPct: 0.65,
      totalPayouts: overrides.totalPayouts ?? 10000,
      netMarginAfterPayouts: overrides.netMarginAfterPayouts ?? 55000,
      payouts: [],
      enfactumNetRevenue: overrides.enfactumNetRevenue,
    } as ProjectFinancials,
  };
}

// ─── Tests ───────────────────────────────────────────────────────

describe("calculateGrossMarginPct", () => {
  it("returns margin ratio when revenue > 0", () => {
    expect(calculateGrossMarginPct(200000, 60000)).toBeCloseTo(0.3);
  });

  it("returns 0 when revenue is 0", () => {
    expect(calculateGrossMarginPct(0, 0)).toBe(0);
  });

  it("handles negative margin", () => {
    expect(calculateGrossMarginPct(100000, -5000)).toBeCloseTo(-0.05);
  });
});

describe("calculateGrossMargin", () => {
  it("subtracts all cost components from revenue", () => {
    expect(calculateGrossMargin(120000, 18700, 28000, 3000)).toBe(70300);
  });

  it("returns negative when costs exceed revenue", () => {
    expect(calculateGrossMargin(10000, 5000, 4000, 3000)).toBe(-2000);
  });

  it("returns revenue when all costs are zero", () => {
    expect(calculateGrossMargin(50000, 0, 0, 0)).toBe(50000);
  });
});

describe("calculateNetMargin", () => {
  it("subtracts payouts from gross margin", () => {
    expect(calculateNetMargin(70300, 13030)).toBe(57270);
  });

  it("returns gross margin when payouts are zero", () => {
    expect(calculateNetMargin(50000, 0)).toBe(50000);
  });
});

describe("normalizeToSGD", () => {
  it("delegates to the provided conversion function", () => {
    const toSGD = (amount: number, cur: string) =>
      cur === "USD" ? amount * 1.35 : amount;
    expect(normalizeToSGD(1000, "USD", toSGD)).toBeCloseTo(1350);
  });

  it("returns amount unchanged for SGD", () => {
    const toSGD = (amount: number, _cur: string) => amount;
    expect(normalizeToSGD(5000, "SGD", toSGD)).toBe(5000);
  });
});

describe("aggregatePortfolioTotals", () => {
  const projects = [
    makeProjectData({ revenueUsed: 120000, grossMargin: 70300, netMarginAfterPayouts: 57270, totalPayouts: 13030, internalCost: 18700, vendorCost: 28000, otherCost: 3000 }),
    makeProjectData({ revenueUsed: 135000, grossMargin: 96800, netMarginAfterPayouts: 79006, totalPayouts: 17794, internalCost: 23700, vendorCost: 12000, otherCost: 2500 }),
  ];

  it("sums all fields without currency conversion", () => {
    const totals = aggregatePortfolioTotals(projects);
    expect(totals.revenue).toBe(255000);
    expect(totals.grossMargin).toBe(167100);
    expect(totals.netMargin).toBe(136276);
    expect(totals.totalPayouts).toBe(30824);
    expect(totals.internalCost).toBe(42400);
    expect(totals.vendorCost).toBe(40000);
    expect(totals.otherCost).toBe(5500);
  });

  it("applies currency conversion when toSGD is provided", () => {
    const usdProject = makeProjectData({ currency: "USD", revenueUsed: 80000, grossMargin: 59225, netMarginAfterPayouts: 55225, totalPayouts: 4000, internalCost: 9060, vendorCost: 11715, otherCost: 0 });
    const toSGD = (amount: number, cur: string) => cur === "USD" ? amount * 1.28 : amount;
    const totals = aggregatePortfolioTotals([usdProject], toSGD);
    expect(totals.revenue).toBeCloseTo(80000 * 1.28);
  });

  it("returns zeros for empty array", () => {
    const totals = aggregatePortfolioTotals([]);
    expect(totals.revenue).toBe(0);
    expect(totals.grossMargin).toBe(0);
  });
});

describe("aggregateRawTotals", () => {
  it("delegates to aggregatePortfolioTotals without conversion", () => {
    const projects = [makeProjectData({ revenueUsed: 50000 })];
    const totals = aggregateRawTotals(projects);
    expect(totals.revenue).toBe(50000);
  });
});

describe("filterByDateRange", () => {
  const projects = [
    makeProjectData({ start_date: "2025-01-01", end_date: "2025-03-31" }),
    makeProjectData({ start_date: "2025-04-01", end_date: "2025-06-30" }),
    makeProjectData({ start_date: "2025-07-01", end_date: "2025-09-30" }),
  ];

  it("returns all when no dates specified", () => {
    expect(filterByDateRange(projects, undefined, undefined)).toHaveLength(3);
  });

  it("filters out projects ending before dateFrom", () => {
    const result = filterByDateRange(projects, new Date("2025-04-01"), undefined);
    expect(result).toHaveLength(2);
  });

  it("filters out projects starting after dateTo", () => {
    const result = filterByDateRange(projects, undefined, new Date("2025-06-30"));
    expect(result).toHaveLength(2);
  });

  it("returns overlapping projects for tight range", () => {
    const result = filterByDateRange(projects, new Date("2025-05-01"), new Date("2025-05-31"));
    expect(result).toHaveLength(1);
  });
});

describe("isPayoutGuardrailTriggered", () => {
  it("returns false for non-pass-through projects", () => {
    const fin = { totalPayouts: 50000, enfactumNetRevenue: 100000 } as ProjectFinancials;
    expect(isPayoutGuardrailTriggered(fin, false)).toBe(false);
  });

  it("returns false when payouts ≤ 40%", () => {
    const fin = { totalPayouts: 40000, enfactumNetRevenue: 100000 } as ProjectFinancials;
    expect(isPayoutGuardrailTriggered(fin, true)).toBe(false);
  });

  it("returns true when payouts > 40%", () => {
    const fin = { totalPayouts: 41000, enfactumNetRevenue: 100000 } as ProjectFinancials;
    expect(isPayoutGuardrailTriggered(fin, true)).toBe(true);
  });

  it("returns false when enfactumNetRevenue is undefined", () => {
    const fin = { totalPayouts: 50000 } as ProjectFinancials;
    expect(isPayoutGuardrailTriggered(fin, true)).toBe(false);
  });
});

describe("isGrossMarginBelowTarget", () => {
  it("returns true when GM% is below target", () => {
    expect(isGrossMarginBelowTarget(0.29, 30)).toBe(true);
  });

  it("returns false when GM% meets target", () => {
    expect(isGrossMarginBelowTarget(0.40, 40)).toBe(false);
  });

  it("returns false when GM% exceeds target", () => {
    expect(isGrossMarginBelowTarget(0.50, 40)).toBe(false);
  });
});
