import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  CheckCircle2,
  XCircle,
  Pencil
} from "lucide-react";
import type { Vendor } from "@/types/database";
import { format } from "date-fns";

interface VendorDetailSheetProps {
  vendor: Vendor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VendorDetailSheet({ vendor, open, onOpenChange }: VendorDetailSheetProps) {
  if (!vendor) return null;

  const getOnboardingStatusColor = (status: string) => {
    switch (status) {
      case 'Complete':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[480px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-left">{vendor.name}</SheetTitle>
                <Badge variant="outline" className="mt-1">{vendor.type}</Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status Section */}
          <div className="flex items-center gap-4">
            <Badge className={getOnboardingStatusColor(vendor.onboarding_status)}>
              {vendor.onboarding_status}
            </Badge>
            {vendor.is_active ? (
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Active
              </Badge>
            ) : (
              <Badge variant="secondary">
                <XCircle className="h-3 w-3 mr-1" />
                Inactive
              </Badge>
            )}
          </div>

          <Separator />

          {/* Contact Information */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Contact Information</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{vendor.market}</span>
              </div>
              {vendor.contact_name && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{vendor.contact_name}</span>
                </div>
              )}
              {vendor.contact_email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={`mailto:${vendor.contact_email}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {vendor.contact_email}
                  </a>
                </div>
              )}
              {vendor.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{vendor.phone}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Services */}
          {vendor.services && vendor.services.length > 0 && (
            <>
              <div>
                <h4 className="text-sm font-semibold mb-3">Services</h4>
                <div className="flex flex-wrap gap-2">
                  {vendor.services.map((service) => (
                    <Badge key={service} variant="secondary">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Technical Details */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Technical Details</h4>
            <div className="space-y-2">
              {vendor.meta_pixel_id && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Meta Pixel ID</span>
                  <code className="bg-muted px-2 py-1 rounded text-xs">
                    {vendor.meta_pixel_id}
                  </code>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Brand Guidelines</span>
                <span>{vendor.brand_guidelines_uploaded ? 'Uploaded' : 'Not uploaded'}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Metadata */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Record Info</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(vendor.created_at), 'MMM d, yyyy')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(vendor.updated_at), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4">
            <Button variant="outline" className="w-full">
              <Pencil className="h-4 w-4 mr-2" />
              Edit Vendor
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
