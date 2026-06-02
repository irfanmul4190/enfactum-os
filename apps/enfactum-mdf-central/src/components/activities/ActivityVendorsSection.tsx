import { useState } from "react";
import { Plus, X, Building2, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useVendors, useActivityVendors, useAddActivityVendor, useRemoveActivityVendor } from "@/hooks/useVendors";
import type { VendorRole } from "@/types/database";

interface ActivityVendorsSectionProps {
  activityId: string;
  onUpdate?: () => void;
}

const vendorRoleColors: Record<VendorRole, string> = {
  Primary: 'bg-primary/10 text-primary border-primary/20',
  Secondary: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200',
  Support: 'bg-muted text-muted-foreground border-muted',
};

export function ActivityVendorsSection({ activityId, onUpdate }: ActivityVendorsSectionProps) {
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<VendorRole>('Primary');
  
  const { data: allVendors = [] } = useVendors();
  const { data: activityVendors = [], isLoading } = useActivityVendors(activityId);
  const addVendor = useAddActivityVendor();
  const removeVendor = useRemoveActivityVendor();

  // Filter out vendors already assigned to this activity
  const availableVendors = allVendors.filter(
    (v) => !activityVendors.some((av) => av.vendor_id === v.id)
  );

  const handleAddVendor = async (vendorId: string) => {
    await addVendor.mutateAsync({
      activity_id: activityId,
      vendor_id: vendorId,
      role: selectedRole,
    });
    setOpen(false);
    onUpdate?.();
  };

  const handleRemoveVendor = async (vendorId: string) => {
    await removeVendor.mutateAsync({
      activity_id: activityId,
      vendor_id: vendorId,
    });
    onUpdate?.();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Vendors
        </h3>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1">
              <Plus className="h-3 w-3" />
              Add
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="end">
            <div className="p-3 border-b border-border">
              <label className="text-xs text-muted-foreground">Role</label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as VendorRole)}>
                <SelectTrigger className="mt-1 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Primary">Primary</SelectItem>
                  <SelectItem value="Secondary">Secondary</SelectItem>
                  <SelectItem value="Support">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Command>
              <CommandInput placeholder="Search vendors..." />
              <CommandList>
                <CommandEmpty>
                  {availableVendors.length === 0 
                    ? "All vendors assigned" 
                    : "No vendor found"}
                </CommandEmpty>
                <CommandGroup>
                  {availableVendors.map((vendor) => (
                    <CommandItem
                      key={vendor.id}
                      value={vendor.name}
                      onSelect={() => handleAddVendor(vendor.id)}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{vendor.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {vendor.type} • {vendor.market}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <div className="h-12 bg-muted/50 rounded animate-pulse" />
          <div className="h-12 bg-muted/50 rounded animate-pulse" />
        </div>
      ) : activityVendors.length === 0 ? (
        <div className="text-center py-6 bg-muted/30 rounded-lg border border-dashed border-border">
          <Building2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No vendors assigned</p>
          <p className="text-xs text-muted-foreground mt-1">
            Click "Add" to assign a vendor
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {activityVendors.map((av) => (
            <div
              key={av.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 group"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{av.vendor?.name || 'Unknown Vendor'}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {av.vendor?.type}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs h-5", vendorRoleColors[av.role as VendorRole])}
                    >
                      {av.role}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemoveVendor(av.vendor_id)}
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
