import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useResources, Resource, ResourceCategory } from "@/hooks/useResources";
import { useCurrentUserPermissions, useIsInternalUser } from "@/hooks/useCurrentUserPermissions";
import { ResourceCategorySection } from "@/components/resources/ResourceCategorySection";
import { ManageLinkModal } from "@/components/resources/ManageLinkModal";
import { AddResourceModal } from "@/components/resources/AddResourceModal";

const CATEGORY_ORDER: ResourceCategory[] = [
  'MDF Contracts',
  'Brand Guidelines',
  'Strategic Assets',
  'Alliance Partners',
  'General Resources',
];

export default function Resources() {
  const { data: resources, isLoading } = useResources();
  const permissions = useCurrentUserPermissions();
  const isInternal = useIsInternalUser();
  
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Role-based visibility:
  // - Partners only see partner-facing resources
  // - Internal users see all resources
  const visibleResources = useMemo(() => {
    if (!resources) return [];
    
    if (permissions.role === 'Partner') {
      return resources.filter(r => r.is_partner_facing);
    }
    
    return resources;
  }, [resources, permissions.role]);

  // Group resources by category
  const resourcesByCategory = useMemo(() => {
    const grouped: Record<ResourceCategory, Resource[]> = {
      'MDF Contracts': [],
      'Brand Guidelines': [],
      'Strategic Assets': [],
      'Alliance Partners': [],
      'General Resources': [],
    };
    
    visibleResources.forEach((resource) => {
      grouped[resource.category]?.push(resource);
    });
    
    return grouped;
  }, [visibleResources]);

  // Role-based edit permissions:
  // - Agency Director: Can edit all
  // - Ops: Can manage MDF Contracts and Strategic Assets (Rate Cards)
  // - Others: View only
  const canEditCategory = (category: ResourceCategory): boolean => {
    if (permissions.role === 'Agency Director' || permissions.role === 'Super Admin') {
      return true;
    }
    if (permissions.role === 'Ops') {
      return category === 'MDF Contracts' || category === 'Strategic Assets';
    }
    return false;
  };

  const canAddResources = permissions.role === 'Agency Director' || 
                          permissions.role === 'Super Admin' || 
                          permissions.role === 'Ops';

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="page-header">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Resource Hub</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Central repository for brand assets and documentation
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="page-header flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Resource Hub</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Central repository for brand assets and documentation
            </p>
          </div>
          {canAddResources && (
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Resource
            </Button>
          )}
        </div>

        {visibleResources.length === 0 ? (
          <div className="section-container p-12 flex flex-col items-center justify-center text-center">
            <p className="text-muted-foreground">No resources available</p>
          </div>
        ) : (
          <div className="space-y-8">
            {CATEGORY_ORDER.map((category) => (
              <ResourceCategorySection
                key={category}
                category={category}
                resources={resourcesByCategory[category]}
                canEdit={canEditCategory(category)}
                onEditResource={setEditingResource}
              />
            ))}
          </div>
        )}
      </div>

      <ManageLinkModal
        resource={editingResource}
        open={!!editingResource}
        onOpenChange={(open) => !open && setEditingResource(null)}
      />
      
      <AddResourceModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />
    </AppLayout>
  );
}
