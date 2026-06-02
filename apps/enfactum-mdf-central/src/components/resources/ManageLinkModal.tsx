import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Resource, useUpdateResource } from "@/hooks/useResources";

interface ManageLinkModalProps {
  resource: Resource | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageLinkModal({ resource, open, onOpenChange }: ManageLinkModalProps) {
  const [driveLink, setDriveLink] = useState("");
  const updateResource = useUpdateResource();

  useEffect(() => {
    if (resource) {
      setDriveLink(resource.drive_link || "");
    }
  }, [resource]);

  const handleSave = async () => {
    if (!resource) return;
    
    await updateResource.mutateAsync({ id: resource.id, drive_link: driveLink });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Link</DialogTitle>
          <DialogDescription>
            Paste the Google Drive WebViewLink for "{resource?.title}"
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="drive-link">Google Drive Link</Label>
            <Input
              id="drive-link"
              placeholder="https://drive.google.com/..."
              value={driveLink}
              onChange={(e) => setDriveLink(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Right-click the file in Google Drive → Get link → Copy link
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateResource.isPending}>
            {updateResource.isPending ? "Saving..." : "Save Link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
