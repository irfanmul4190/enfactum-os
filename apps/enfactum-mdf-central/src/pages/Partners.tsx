import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";

export default function Partners() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="page-header">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Partners</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Partner onboarding and digital asset vault
            </p>
          </div>
        </div>
        <div className="section-container p-12 flex flex-col items-center justify-center text-center">
          <Badge variant="secondary" className="mb-4">Coming Soon</Badge>
          <h2 className="text-lg font-semibold text-foreground">Digital Onboarding Vault</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            Partner asset management with Meta Pixel IDs, brand guidelines, and onboarding status tracking.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
