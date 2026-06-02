import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateResource, ResourceCategory, ResourceFileType } from "@/hooks/useResources";

interface AddResourceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORIES: ResourceCategory[] = [
  'MDF Contracts',
  'Brand Guidelines',
  'Strategic Assets',
  'Alliance Partners',
  'General Resources',
];

const FILE_TYPES: { value: ResourceFileType; label: string }[] = [
  { value: 'pdf', label: 'PDF' },
  { value: 'sheets', label: 'Google Sheets' },
  { value: 'slides', label: 'Google Slides' },
  { value: 'docs', label: 'Google Docs' },
  { value: 'folder', label: 'Folder' },
  { value: 'other', label: 'Other' },
];

export function AddResourceModal({ open, onOpenChange }: AddResourceModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ResourceCategory>("General Resources");
  const [fileType, setFileType] = useState<ResourceFileType>("pdf");
  const [driveLink, setDriveLink] = useState("");
  const [isPartnerFacing, setIsPartnerFacing] = useState(false);
  
  const createResource = useCreateResource();

  const handleSubmit = async () => {
    if (!title.trim()) return;
    
    await createResource.mutateAsync({
      title: title.trim(),
      category,
      file_type: fileType,
      drive_link: driveLink || null,
      is_partner_facing: isPartnerFacing,
      display_order: 99,
    });
    
    // Reset form
    setTitle("");
    setCategory("General Resources");
    setFileType("pdf");
    setDriveLink("");
    setIsPartnerFacing(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Resource</DialogTitle>
          <DialogDescription>
            Add a new resource to the hub
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Resource title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ResourceCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>File Type</Label>
            <Select value={fileType} onValueChange={(v) => setFileType(v as ResourceFileType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FILE_TYPES.map((ft) => (
                  <SelectItem key={ft.value} value={ft.value}>
                    {ft.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="drive-link">Google Drive Link (optional)</Label>
            <Input
              id="drive-link"
              placeholder="https://drive.google.com/..."
              value={driveLink}
              onChange={(e) => setDriveLink(e.target.value)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="partner-facing">Visible to Partners</Label>
            <Switch
              id="partner-facing"
              checked={isPartnerFacing}
              onCheckedChange={setIsPartnerFacing}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || createResource.isPending}>
            {createResource.isPending ? "Adding..." : "Add Resource"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
