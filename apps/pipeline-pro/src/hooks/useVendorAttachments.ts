import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useVendorAttachments(vendorId: string | undefined) {
  return useQuery({
    queryKey: ['vendor_attachments', vendorId],
    queryFn: async () => {
      if (!vendorId) return [];
      const { data, error } = await supabase
        .from('vendor_attachments')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!vendorId,
  });
}

export function useUploadVendorAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      file,
      vendorId,
      attachmentType,
      uploadedBy,
    }: {
      file: File;
      vendorId: string;
      attachmentType: 'pricelist' | 'general';
      uploadedBy?: string;
    }) => {
      const path = `${vendorId}/${attachmentType}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('vendor-attachments')
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from('vendor_attachments')
        .insert({
          vendor_id: vendorId,
          file_name: file.name,
          file_path: path,
          file_type: file.name.split('.').pop() ?? null,
          file_size: file.size,
          attachment_type: attachmentType,
          uploaded_by: uploadedBy ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['vendor_attachments', vars.vendorId] }),
  });
}

export function useDeleteVendorAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, filePath, vendorId }: { id: string; filePath: string; vendorId: string }) => {
      await supabase.storage.from('vendor-attachments').remove([filePath]);
      const { error } = await supabase.from('vendor_attachments').delete().eq('id', id);
      if (error) throw error;
      return { vendorId };
    },
    onSuccess: (r) => qc.invalidateQueries({ queryKey: ['vendor_attachments', r.vendorId] }),
  });
}

export function useVendorAttachmentUrl() {
  return async (filePath: string) => {
    const { data } = await supabase.storage
      .from('vendor-attachments')
      .createSignedUrl(filePath, 3600);
    return data?.signedUrl ?? '';
  };
}