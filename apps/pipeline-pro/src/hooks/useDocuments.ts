import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useDocuments(dealId: string | undefined) {
  return useQuery({
    queryKey: ['documents', dealId],
    queryFn: async () => {
      if (!dealId) return [];
      const { data, error } = await supabase
        .from('deal_documents')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!dealId,
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      file,
      dealId,
      accountId,
      uploadedBy,
    }: {
      file: File;
      dealId: string;
      accountId: string;
      uploadedBy?: string;
    }) => {
      const ext = file.name.split('.').pop();
      const path = `${accountId}/${dealId}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('deal-documents')
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data, error: dbError } = await supabase
        .from('deal_documents')
        .insert({
          deal_id: dealId,
          account_id: accountId,
          file_name: file.name,
          file_path: path,
          file_type: ext || null,
          file_size: file.size,
          uploaded_by: uploadedBy || null,
        })
        .select()
        .single();
      if (dbError) throw dbError;
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['documents', variables.dealId] });
    },
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, filePath, dealId }: { id: string; filePath: string; dealId: string }) => {
      await supabase.storage.from('deal-documents').remove([filePath]);
      const { error } = await supabase.from('deal_documents').delete().eq('id', id);
      if (error) throw error;
      return { id, dealId };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['documents', result.dealId] });
    },
  });
}

export function useDocumentUrl() {
  return async (filePath: string): Promise<string> => {
    const { data } = await supabase.storage
      .from('deal-documents')
      .createSignedUrl(filePath, 3600);
    return data?.signedUrl || '';
  };
}
export function useAccountDocuments(accountId: string | undefined) {
  return useQuery({
    queryKey: ['documents', 'account', accountId],
    queryFn: async () => {
      if (!accountId) return [];
      const { data, error } = await supabase
        .from('deal_documents')
        .select('*')
        .eq('account_id', accountId)
        .is('deal_id', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!accountId,
  });
}