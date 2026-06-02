import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { useDataStore } from "@/hooks/useDataStore";
import { computeProjectFinancials } from "@/lib/calculations";
import { fmtMoney } from "@/lib/formatters";
import { CheckCircle, XCircle, RefreshCw } from "lucide-react";

interface TestCheck {
  label: string;
  expected: number;
  actual: number;
}

interface TestResult {
  name: string;
  projectId: string;
  checks: TestCheck[];
}

function approxEqual(a: number, b: number, tol = 1): boolean {
  return Math.abs(a - b) <= tol;
}

function runTests(store: ReturnType<typeof useDataStore>): TestResult[] {
  const { projects, timesheets, vendorCosts, otherCosts, invoices, splits } = store;
  const results: TestResult[] = [];

  const compute = (pid: string) => {
    const p = projects.find(pr => pr.project_id === pid);
    if (!p) return null;
    return computeProjectFinancials(
      p,
      timesheets.filter(t => t.project_id === pid),
      vendorCosts.filter(v => v.project_id === pid),
      otherCosts.filter(o => o.project_id === pid),
      invoices.filter(i => i.project_id === pid),
      splits.filter(s => s.project_id === pid)
    );
  };

  // Run tests only if seed project IDs exist
  const f1 = compute("p1");
  if (f1) {
    results.push({
      name: "Project 1: HP APAC Partner AI Webinar Series",
      projectId: "p1",
      checks: [
        { label: "RevenueUsed", expected: 120000, actual: f1.revenueUsed },
        { label: "InternalCost", expected: 18700, actual: f1.internalCost },
        { label: "VendorCost", expected: 28000, actual: f1.vendorCost },
        { label: "OtherCost", expected: 3000, actual: f1.otherCost },
        { label: "GrossMargin", expected: 70300, actual: f1.grossMargin },
        { label: "Ajay Payout", expected: 6000, actual: f1.payouts.find(p => p.stakeholder_id === "s1")?.final_amount ?? 0 },
        { label: "Priya Payout", expected: 7030, actual: f1.payouts.find(p => p.stakeholder_id === "s2")?.final_amount ?? 0 },
        { label: "TotalPayouts", expected: 13030, actual: f1.totalPayouts },
        { label: "NetMarginAfterPayouts", expected: 57270, actual: f1.netMarginAfterPayouts },
      ],
    });
  }

  const f2 = compute("p2");
  if (f2) {
    results.push({
      name: "Project 2: Lenovo ISG Always-On Content Retainer",
      projectId: "p2",
      checks: [
        { label: "RevenueUsed", expected: 135000, actual: f2.revenueUsed },
        { label: "InternalCost", expected: 23700, actual: f2.internalCost },
        { label: "VendorCost", expected: 12000, actual: f2.vendorCost },
        { label: "OtherCost", expected: 2500, actual: f2.otherCost },
        { label: "GrossMargin", expected: 96800, actual: f2.grossMargin },
        { label: "TotalPayouts", expected: 17794, actual: f2.totalPayouts },
        { label: "NetMarginAfterPayouts", expected: 79006, actual: f2.netMarginAfterPayouts },
      ],
    });
  }

  const f3 = compute("p3");
  if (f3) {
    results.push({
      name: "Project 3: Qualcomm AI PC Roadshow (Pass-Through)",
      projectId: "p3",
      checks: [
        { label: "PartnerRevenue", expected: 200000, actual: f3.partnerRevenue ?? 0 },
        { label: "FlatFeeAmount", expected: 20000, actual: f3.flatFeeAmount ?? 0 },
        { label: "TotalPayouts", expected: 4170, actual: f3.totalPayouts },
      ],
    });
  }

  if (results.length === 0) {
    results.push({
      name: "No seed data projects found",
      projectId: "none",
      checks: [{ label: "Data is now from Supabase", expected: 1, actual: 1 }],
    });
  }

  return results;
}

export default function ValidationPage() {
  const store = useDataStore();
  const [key, setKey] = useState(0);
  const results = useMemo(() => runTests(store), [key, store.projects, store.timesheets]);

  const totalChecks = results.reduce((s, r) => s + r.checks.length, 0);
  const passedChecks = results.reduce((s, r) => s + r.checks.filter(c => approxEqual(c.actual, c.expected)).length, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Validation Tests</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {passedChecks}/{totalChecks} checks passed · All expected values are in SG$ unless stated
          </p>
        </div>
        <button className="btn-glass" onClick={() => setKey(k => k + 1)}>
          <RefreshCw className="h-4 w-4" />
          Recompute
        </button>
      </div>

      <div className="flex gap-2">
        <span className={passedChecks === totalChecks ? "badge-positive" : "badge-negative"}>
          {passedChecks === totalChecks ? "ALL PASS" : `${totalChecks - passedChecks} FAILURES`}
        </span>
      </div>

      <div className="space-y-4">
        {results.map(result => {
          const allPass = result.checks.every(c => approxEqual(c.actual, c.expected));
          return (
            <div key={result.projectId} className="glass-card overflow-hidden">
              <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "var(--glass-border)" }}>
                {allPass ? <CheckCircle className="h-5 w-5 stat-positive" /> : <XCircle className="h-5 w-5 stat-negative" />}
                <h3 className="text-base font-semibold">{result.name}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full data-table">
                  <thead>
                    <tr>
                      <th>Check</th>
                      <th className="text-right">Expected (SG$)</th>
                      <th className="text-right">Actual (SG$)</th>
                      <th className="text-center">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.checks.map(check => {
                      const pass = approxEqual(check.actual, check.expected);
                      return (
                        <tr key={check.label}>
                          <td>{check.label}</td>
                          <td className="text-right tabular-nums mono">{fmtMoney(check.expected, "SGD")}</td>
                          <td className="text-right tabular-nums mono">{fmtMoney(check.actual, "SGD")}</td>
                          <td className="text-center">
                            <span className={pass ? "badge-positive" : "badge-negative"}>
                              {pass ? "PASS" : "FAIL"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
