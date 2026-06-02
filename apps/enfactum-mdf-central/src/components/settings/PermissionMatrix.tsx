import { 
  useRolePermissions, 
  useUpdateRolePermission,
  ROLE_DISPLAY_CONFIG,
  PERMISSION_COLUMNS,
  isPermissionLocked,
  PermissionKey
} from "@/hooks/useRolePermissions";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Lock, ShieldAlert } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export function PermissionMatrix() {
  const { data: permissions, isLoading, error } = useRolePermissions();
  const updatePermission = useUpdateRolePermission();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
        <p className="font-medium">Error loading permissions</p>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  const handleToggle = (role: AppRole, permission: PermissionKey, currentValue: boolean) => {
    if (isPermissionLocked(role, permission)) return;
    
    updatePermission.mutate({
      role,
      permission,
      value: !currentValue,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Permission Matrix</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Configure role-based permissions. Some permissions are locked for security compliance.
      </p>
      
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold w-48">Role</TableHead>
              {PERMISSION_COLUMNS.map((col) => (
                <TableHead key={col.key} className="text-center font-semibold">
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {permissions?.map((perm) => (
              <TableRow key={perm.id}>
                <TableCell className="font-medium">
                  {ROLE_DISPLAY_CONFIG[perm.role]?.label || perm.role}
                </TableCell>
                {PERMISSION_COLUMNS.map((col) => {
                  const permKey = col.key as PermissionKey;
                  const isLocked = isPermissionLocked(perm.role, permKey);
                  const value = perm[permKey] as boolean;

                  return (
                    <TableCell key={col.key} className="text-center">
                      {isLocked ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="inline-flex items-center justify-center">
                              <Lock className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>This permission is locked for {ROLE_DISPLAY_CONFIG[perm.role]?.label || perm.role}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Switch
                          checked={value}
                          onCheckedChange={() => handleToggle(perm.role, permKey, value)}
                          disabled={updatePermission.isPending}
                        />
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-4">
        <div className="flex items-center gap-1">
          <Lock className="h-3 w-3" />
          <span>Locked - Permission cannot be changed (security guardrail)</span>
        </div>
      </div>
    </div>
  );
}
