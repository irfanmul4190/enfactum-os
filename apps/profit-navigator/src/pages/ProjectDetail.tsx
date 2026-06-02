import { useParams, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjectFinancials } from "@/hooks/useProjectFinancials";
import { useDataStore } from "@/hooks/useDataStore";
import { useCurrency } from "@/hooks/useCurrency";
import { FileText, BarChart3 } from "lucide-react";
import { ErrorBoundary } from "@repo/ui/error-boundary";
import { ProjectHeader } from "@/components/project/ProjectHeader";
import { MarginVelocityChart } from "@/components/project/MarginVelocityChart";
import { TimesheetTab } from "@/components/project/TimesheetTab";
import { StakeholdersTab } from "@/components/project/StakeholdersTab";
import { CostsTab } from "@/components/project/CostsTab";
import { InvoicesTab } from "@/components/project/InvoicesTab";
import { SettlementTab } from "@/components/project/SettlementTab";
import { DocumentsTab } from "@/components/project/DocumentsTab";
import { MarginsTab } from "@/components/project/MarginsTab";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "overview";
  const referrer = searchParams.get("from") as "dashboard" | "projects" | null;
  const data = useProjectFinancials(id ?? "");
  const store = useDataStore();
  const { fxRates, lastUpdated, toSGD } = useCurrency();

  if (!data) return <div className="p-6">Project not found.</div>;

  const { project, financials } = data;
  const cur = project.currency || "SGD";
  const isPassThrough = project.commercial_model === "PARTNER_PASS_THROUGH";
  const isForeign = cur !== "SGD";
  const fxKey = `${cur}_SGD`;
  const fxRate = fxRates[fxKey];

  const pTimesheets = store.timesheets.filter(t => t.project_id === project.project_id);
  const pVendorCosts = store.vendorCosts.filter(v => v.project_id === project.project_id);
  const pOtherCosts = store.otherCosts.filter(o => o.project_id === project.project_id);
  const pInvoices = store.invoices.filter(i => i.project_id === project.project_id);
  const pSplits = store.splits.filter(s => s.project_id === project.project_id);
  const pDocuments = store.documents.filter(d => d.project_id === project.project_id);

  return (
    <div className="p-6 space-y-6">
      <ErrorBoundary fallbackTitle="Failed to load project header">
        <ProjectHeader data={data} toSGD={toSGD} fxRate={fxRate} lastUpdated={lastUpdated} referrer={referrer} />
      </ErrorBoundary>

      <ErrorBoundary fallbackTitle="Failed to load margin velocity">
        <MarginVelocityChart project={project} timesheets={pTimesheets} />
      </ErrorBoundary>

      <Tabs defaultValue={initialTab} key={initialTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stakeholders">Stakeholders</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          {isPassThrough && <TabsTrigger value="settlement">Settlement</TabsTrigger>}
          <TabsTrigger value="margins"><BarChart3 className="h-3.5 w-3.5 mr-1" />Margins</TabsTrigger>
          <TabsTrigger value="documents"><FileText className="h-3.5 w-3.5 mr-1" />Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ErrorBoundary fallbackTitle="Failed to load Overview tab">
            <TimesheetTab
              projectId={project.project_id}
              timesheets={pTimesheets}
              onAdd={store.addTimesheet}
              onUpdate={store.updateTimesheet}
              onDelete={store.deleteTimesheet}
            />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="stakeholders">
          <ErrorBoundary fallbackTitle="Failed to load Stakeholders tab">
            <StakeholdersTab financials={financials} splits={pSplits} currency={cur} />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="costs">
          <ErrorBoundary fallbackTitle="Failed to load Costs tab">
            <CostsTab
              projectId={project.project_id}
              currency={cur}
              isForeign={isForeign}
              vendorCosts={pVendorCosts}
              otherCosts={pOtherCosts}
              financials={financials}
              toSGD={toSGD}
              onAddVendorCost={store.addVendorCost}
              onUpdateVendorCost={store.updateVendorCost}
              onDeleteVendorCost={store.deleteVendorCost}
            />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="invoices">
          <ErrorBoundary fallbackTitle="Failed to load Invoices tab">
            <InvoicesTab invoices={pInvoices} currency={cur} isForeign={isForeign} toSGD={toSGD} />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="margins">
          <ErrorBoundary fallbackTitle="Failed to load Margins tab">
            <MarginsTab dealId={project.project_id} currency={cur} />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="documents">
          <ErrorBoundary fallbackTitle="Failed to load Documents tab">
            <DocumentsTab projectId={project.project_id} documents={pDocuments} onAdd={store.addDocument} onDelete={store.deleteDocument} />
          </ErrorBoundary>
        </TabsContent>

        {isPassThrough && (
          <TabsContent value="settlement">
            <ErrorBoundary fallbackTitle="Failed to load Settlement tab">
              <SettlementTab project={project} financials={financials} toSGD={toSGD} />
            </ErrorBoundary>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
