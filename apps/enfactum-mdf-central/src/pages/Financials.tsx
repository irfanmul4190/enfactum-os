import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";

export default function Financials() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="page-header">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Financials</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Budget tracking and financial reporting
            </p>
          </div>
        </div>
        <div className="section-container p-12 flex flex-col items-center justify-center text-center">
          <Badge variant="secondary" className="mb-4">Coming Soon</Badge>
          <h2 className="text-lg font-semibold text-foreground">Financial Overview</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            Budget utilization, claim tracking, and financial analytics dashboard.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
