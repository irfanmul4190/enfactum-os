import { AppLayout } from "@/components/layout/AppLayout";
import { useMDFDeals, useSharedAccounts } from "@/hooks/useSharedDeals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingUp, BarChart3, Loader2 } from "lucide-react";
import { useMemo } from "react";

const stageBadgeVariant = (stage: string | null) => {
  switch (stage?.toLowerCase()) {
    case 'closed won': return 'default';
    case 'negotiation': return 'secondary';
    case 'proposal': return 'outline';
    default: return 'outline';
  }
};

export default function MDFPipeline() {
  const { data: deals, isLoading: dealsLoading, error: dealsError } = useMDFDeals();
  const { data: accounts, isLoading: accountsLoading } = useSharedAccounts();

  const accountMap = useMemo(() => {
    if (!accounts) return {};
    return Object.fromEntries(accounts.map(a => [a.id, a]));
  }, [accounts]);

  const isLoading = dealsLoading || accountsLoading;

  const totalValue = deals?.reduce((sum, d) => sum + (d.value || 0), 0) ?? 0;
  const totalMDF = deals?.reduce((sum, d) => sum + (d.mdf_amount || 0), 0) ?? 0;
  const dealCount = deals?.length ?? 0;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(val);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">MDF Pipeline</h1>
          <p className="text-muted-foreground text-sm">MDF-eligible deals from the shared sales pipeline</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Deal Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{formatCurrency(totalValue)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total MDF Amount</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatCurrency(totalMDF)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Eligible Deals</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{dealCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Deals Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">MDF-Eligible Deals</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading deals...</span>
              </div>
            ) : dealsError ? (
              <div className="text-center py-12 text-destructive">
                Failed to load deals. Make sure the shared database connection is configured.
              </div>
            ) : !deals?.length ? (
              <div className="text-center py-12 text-muted-foreground space-y-1">
                <p>No MDF-eligible deals yet.</p>
                <p className="text-xs">
                  Cross-app pipeline integration (pulls from Pipeline Pro) is not wired up yet.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deal</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead className="text-right">Deal Value</TableHead>
                    <TableHead className="text-right">MDF Amount</TableHead>
                    <TableHead>Product Lines</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deals.map((deal) => {
                    const account = deal.account_id ? accountMap[deal.account_id] : null;
                    return (
                      <TableRow key={deal.id}>
                        <TableCell className="font-medium">{deal.title}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {account?.name ?? '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={stageBadgeVariant(deal.stage)}>
                            {deal.stage ?? 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(deal.value)}
                        </TableCell>
                        <TableCell className="text-right text-primary font-medium">
                          {deal.mdf_amount ? formatCurrency(deal.mdf_amount) : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {deal.product_lines?.map((pl) => (
                              <Badge key={pl} variant="secondary" className="text-xs">{pl}</Badge>
                            )) ?? '—'}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
