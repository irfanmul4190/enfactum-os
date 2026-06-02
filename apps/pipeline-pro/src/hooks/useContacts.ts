import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useContacts(accountId: string | undefined) {
  return useQuery({
    queryKey: ['contacts', accountId],
    queryFn: async () => {
      if (!accountId) return [];
      const { data, error } = await supabase
        .from('account_contacts')
        .select('*')
        .eq('account_id', accountId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!accountId,
  });
}

export function useAddContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contact: {
      account_id: string;
      name: string;
      email?: string;
      role?: string;
      phone?: string;
      is_primary?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('account_contacts')
        .insert(contact)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['contacts', variables.account_id] });
    },
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, accountId }: { id: string; accountId: string }) => {
      const { error } = await supabase
        .from('account_contacts')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { id, accountId };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['contacts', result.accountId] });
    },
  });
}