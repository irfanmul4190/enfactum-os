import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, type DbVDeal } from '@/integrations/supabase/db';

export function useDeals() {
  return useQuery({
    queryKey: ['deals'],
    queryFn: async () => {
      const { data, error } = await db
        .from('v_deals')
        .select('*')
        .order('deal_updated_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as DbVDeal[];
    },
    refetchInterval: 15_000, // Auto-refresh every 15s
    refetchIntervalInBackground: false,
  });
}

export function useDeal(id: string | undefined) {
  return useQuery({
    queryKey: ['deals', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await db
        .from('v_deals')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as DbVDeal | null;
    },
    enabled: !!id,
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { data, error } = await db
        .from('deals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deal: Record<string, any>) => {
      const { data, error } = await db
        .from('deals')
        .insert(deal)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}
