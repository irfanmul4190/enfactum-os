import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ─── Managers ───────────────────────────────────────────────────────────────
export function useManagers() {
  return useQuery({
    queryKey: ['cm_managers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cm_managers')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });
}

export function useAddManager() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (manager: { name: string; email?: string; mobile?: string }) => {
      const { data, error } = await supabase
        .from('cm_managers')
        .insert(manager)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cm_managers'] }),
  });
}

export function useDeleteManager() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cm_managers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cm_managers'] }),
  });
}

// ─── Clients ────────────────────────────────────────────────────────────────
export function useClients(managerId?: string) {
  return useQuery({
    queryKey: ['cm_clients', managerId],
    queryFn: async () => {
      let q = supabase.from('cm_clients').select('*').order('name');
      if (managerId) q = q.eq('manager_id', managerId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useAddClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (client: { name: string; manager_id?: string }) => {
      const { data, error } = await supabase
        .from('cm_clients')
        .insert(client)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cm_clients'] }),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cm_clients').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cm_clients'] }),
  });
}

// ─── Projects ───────────────────────────────────────────────────────────────
export function useProjects(clientId?: string) {
  return useQuery({
    queryKey: ['cm_projects', clientId],
    queryFn: async () => {
      let q = supabase.from('cm_projects').select('*').order('name');
      if (clientId) q = q.eq('client_id', clientId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useAddProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (project: { name: string; client_id: string; description?: string; deal_id?: string }) => {
      const { data, error } = await supabase
        .from('cm_projects')
        .insert(project)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cm_projects'] }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cm_projects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cm_projects'] }),
  });
}

// ─── Documents ──────────────────────────────────────────────────────────────
export function useProjectDocuments(projectId?: string) {
  return useQuery({
    queryKey: ['cm_documents', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('cm_documents')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useUploadProjectDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      file,
      projectId,
      uploadedBy,
    }: {
      file: File;
      projectId: string;
      uploadedBy?: string;
    }) => {
      const path = `${projectId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('cm-documents')
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from('cm_documents')
        .insert({
          project_id: projectId,
          title: file.name,
          source: 'upload',
          file_path: path,
          file_type: file.name.split('.').pop() ?? null,
          file_size: file.size,
          uploaded_by: uploadedBy ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['cm_documents', vars.projectId] }),
  });
}

export function useDeleteProjectDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, filePath, projectId }: { id: string; filePath: string; projectId: string }) => {
      await supabase.storage.from('cm-documents').remove([filePath]);
      const { error } = await supabase.from('cm_documents').delete().eq('id', id);
      if (error) throw error;
      return { projectId };
    },
    onSuccess: (r) => qc.invalidateQueries({ queryKey: ['cm_documents', r.projectId] }),
  });
}

export function useDocumentSignedUrl() {
  return async (filePath: string) => {
    const { data } = await supabase.storage
      .from('cm-documents')
      .createSignedUrl(filePath, 3600);
    return data?.signedUrl ?? '';
  };
}

// ─── Search ─────────────────────────────────────────────────────────────────
export function useCMSearch(query: string) {
  return useQuery({
    queryKey: ['cm_search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const { data, error } = await supabase
        .from('v_cm_search')
        .select('*')
        .or(`manager_name.ilike.%${query}%,client_name.ilike.%${query}%,project_name.ilike.%${query}%`);
      if (error) throw error;
      return data;
    },
    enabled: query.length >= 2,
  });
}