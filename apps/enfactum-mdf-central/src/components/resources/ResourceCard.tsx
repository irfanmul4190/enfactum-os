import { ExternalLink, FileText, Sheet, Presentation, FileType, Folder, File, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Resource, ResourceFileType } from "@/hooks/useResources";

interface ResourceCardProps {
  resource: Resource;
  canEdit: boolean;
  onEditClick: (resource: Resource) => void;
}

const FILE_TYPE_ICONS: Record<ResourceFileType, React.ElementType> = {
  pdf: FileText,
  sheets: Sheet,
  slides: Presentation,
  docs: FileType,
  folder: Folder,
  other: File,
};

const FILE_TYPE_COLORS: Record<ResourceFileType, string> = {
  pdf: 'text-red-500',
  sheets: 'text-green-500',
  slides: 'text-orange-500',
  docs: 'text-blue-500',
  folder: 'text-yellow-500',
  other: 'text-muted-foreground',
};

export function ResourceCard({ resource, canEdit, onEditClick }: ResourceCardProps) {
  const Icon = FILE_TYPE_ICONS[resource.file_type] || File;
  const iconColor = FILE_TYPE_COLORS[resource.file_type] || 'text-muted-foreground';
  
  const handleClick = () => {
    if (resource.drive_link) {
      window.open(resource.drive_link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg bg-muted ${iconColor}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm text-foreground truncate">
              {resource.title}
            </h3>
            <p className="text-xs text-muted-foreground capitalize mt-0.5">
              {resource.file_type === 'other' ? 'File' : resource.file_type}
            </p>
          </div>
          {canEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onEditClick(resource);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-3"
          onClick={handleClick}
          disabled={!resource.drive_link}
        >
          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
          {resource.drive_link ? 'Click to View' : 'Link Not Set'}
        </Button>
      </CardContent>
    </Card>
  );
}
