import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useTags(accountId: string | undefined) {
  return useQuery({
    queryKey: ['tags', accountId],
    queryFn: async () => {
      if (!accountId) return [];
      const { data, error } = await supabase
        .from('account_tags')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!accountId,
  });
}

export function useAllTags() {
  return useQuery({
    queryKey: ['tags', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('account_tags')
        .select('*, accounts(name)')
        .order('tag', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useAddTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ accountId, tag }: { accountId: string; tag: string }) => {
      const { data, error } = await supabase
        .from('account_tags')
        .insert({ account_id: accountId, tag })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['tags', variables.accountId] });
      qc.invalidateQueries({ queryKey: ['tags', 'all'] });
    },
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, accountId }: { id: string; accountId: string }) => {
      const { error } = await supabase
        .from('account_tags')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { id, accountId };
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['tags', variables.accountId] });
      qc.invalidateQueries({ queryKey: ['tags', 'all'] });
    },
  });
}