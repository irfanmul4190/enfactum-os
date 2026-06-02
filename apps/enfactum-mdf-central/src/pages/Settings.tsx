import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PermissionMatrix } from "@/components/settings/PermissionMatrix";
import { RegionalAccessManager } from "@/components/settings/RegionalAccessManager";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUserPermissions } from "@/hooks/useCurrentUserPermissions";
import { Shield, Globe, Settings as SettingsIcon, AlertTriangle } from "lucide-react";

export default function Settings() {
  const { canAdmin, employee } = useAuth();
  const permissions = useCurrentUserPermissions();
  const roleLoading = permissions.isLoading;

  // Three independent paths to admin: the auth-gate matrix admin level,
  // an explicit is_matrix_admin flag on the employees row, or a
  // team_members.role of Agency Director / Super Admin.
  const isAdmin =
    canAdmin ||
    employee?.is_matrix_admin === true ||
    permissions.role === 'Agency Director' ||
    permissions.role === 'Super Admin';

  if (roleLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="page-header">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              System configuration, permissions, and regional access management
            </p>
          </div>
        </div>

        {isAdmin ? (
          <Tabs defaultValue="permissions" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="permissions" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Permissions
              </TabsTrigger>
              <TabsTrigger value="regions" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Regions
              </TabsTrigger>
              <TabsTrigger value="general" className="flex items-center gap-2">
                <SettingsIcon className="h-4 w-4" />
                General
              </TabsTrigger>
            </TabsList>

            <TabsContent value="permissions" className="space-y-6">
              <div className="section-container p-6">
                <PermissionMatrix />
              </div>
            </TabsContent>

            <TabsContent value="regions" className="space-y-6">
              <div className="section-container p-6">
                <RegionalAccessManager />
              </div>
            </TabsContent>

            <TabsContent value="general" className="space-y-6">
              <div className="section-container p-12 flex flex-col items-center justify-center text-center">
                <Badge variant="secondary" className="mb-4">Coming Soon</Badge>
                <h2 className="text-lg font-semibold text-foreground">General Configuration</h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-md">
                  System settings, notification preferences, and integration configuration.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="section-container p-12 flex flex-col items-center justify-center text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold text-foreground">Access Restricted</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Only Agency Directors and Super Admins can access the permission and regional access settings.
              Please contact your administrator if you need access.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
