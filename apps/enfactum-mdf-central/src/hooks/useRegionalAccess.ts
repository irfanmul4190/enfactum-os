import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const AVAILABLE_REGIONS = [
  { value: 'SG', label: 'Singapore' },
  { value: 'PK', label: 'Pakistan' },
  { value: 'SEMC', label: 'SEMC (Southeast Asia Multi-Country)' },
  { value: 'MY', label: 'Malaysia' },
  { value: 'TH', label: 'Thailand' },
  { value: 'VN', label: 'Vietnam' },
  { value: 'ID', label: 'Indonesia' },
  { value: 'PH', label: 'Philippines' },
] as const;

export function useUpdateTeamMemberRegions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      memberId, 
      regions 
    }: { 
      memberId: string; 
      regions: string[];
    }) => {
      const { error } = await supabase
        .from('team_members')
        .update({ accessible_regions: regions })
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({
        title: "Regional Access Updated",
        description: "Team member's market access has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update regional access. " + error.message,
        variant: "destructive",
      });
    },
  });
}
