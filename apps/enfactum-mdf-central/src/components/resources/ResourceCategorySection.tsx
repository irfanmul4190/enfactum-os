import { FileText, Briefcase, Palette, Handshake, FolderOpen } from "lucide-react";
import { Resource, ResourceCategory } from "@/hooks/useResources";
import { ResourceCard } from "./ResourceCard";

interface ResourceCategorySectionProps {
  category: ResourceCategory;
  resources: Resource[];
  canEdit: boolean;
  onEditResource: (resource: Resource) => void;
}

const CATEGORY_ICONS: Record<ResourceCategory, React.ElementType> = {
  'MDF Contracts': FileText,
  'Brand Guidelines': Palette,
  'Strategic Assets': Briefcase,
  'Alliance Partners': Handshake,
  'General Resources': FolderOpen,
};

const CATEGORY_DESCRIPTIONS: Record<ResourceCategory, string> = {
  'MDF Contracts': 'HP MDF contract documents and agreements',
  'Brand Guidelines': 'Brand assets, templates, and co-branding guidelines',
  'Strategic Assets': 'SOW templates, rate cards, and tracking documents',
  'Alliance Partners': 'Intel, AMD, and other partner resources',
  'General Resources': 'Additional resources and documentation',
};

export function ResourceCategorySection({ 
  category, 
  resources, 
  canEdit, 
  onEditResource 
}: ResourceCategorySectionProps) {
  const Icon = CATEGORY_ICONS[category];
  
  if (resources.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">{category}</h2>
          <p className="text-sm text-muted-foreground">{CATEGORY_DESCRIPTIONS[category]}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {resources.map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            canEdit={canEdit}
            onEditClick={onEditResource}
          />
        ))}
      </div>
    </div>
  );
}
