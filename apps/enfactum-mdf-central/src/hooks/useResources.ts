import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type ResourceCategory = 
  | 'MDF Contracts' 
  | 'Brand Guidelines' 
  | 'Strategic Assets' 
  | 'Alliance Partners' 
  | 'General Resources';

export type ResourceFileType = 'pdf' | 'sheets' | 'slides' | 'docs' | 'folder' | 'other';

export interface Resource {
  id: string;
  title: string;
  category: ResourceCategory;
  file_type: ResourceFileType;
  drive_link: string | null;
  is_partner_facing: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export function useResources() {
  return useQuery({
    queryKey: ['resources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('category')
        .order('display_order');
      
      if (error) throw error;
      return data as Resource[];
    },
  });
}

export function useUpdateResource() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, drive_link }: { id: string; drive_link: string }) => {
      const { error } = await supabase
        .from('resources')
        .update({ drive_link })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast({ title: "Link updated successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to update link", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (resource: Omit<Resource, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase
        .from('resources')
        .insert(resource);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast({ title: "Resource added successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to add resource", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
}

export function useDeleteResource() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast({ title: "Resource deleted" });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to delete resource", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
}
