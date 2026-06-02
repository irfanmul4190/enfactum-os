import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, type DbAccount } from '@/integrations/supabase/db';

export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data, error } = await db
        .from('accounts')
        .select('*')
        .order('name');

      if (error) throw error;
      return (data ?? []) as DbAccount[];
    },
  });
}

export function useAccount(id: string | undefined) {
  return useQuery({
    queryKey: ['accounts', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await db
        .from('accounts')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as DbAccount | null;
    },
    enabled: !!id,
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { data, error } = await db
        .from('accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}
