import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Manager = Tables<'cm_managers'>;
export type Client = Tables<'cm_clients'>;
export type Project = Tables<'cm_projects'>;
export type ClientDocument = Tables<'cm_documents'>;
export type DocSearchRow = Tables<'v_cm_documents'>;

const BUCKET = 'client-documents';

// ---- Managers --------------------------------------------------------------
export function useManagers() {
  return useQuery({
    queryKey: ['cm', 'managers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cm_managers')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateManager() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (m: { name: string; email: string; mobile?: string | null; createdBy?: string | null }) => {
      const { data, error } = await supabase
        .from('cm_managers')
        .insert({ name: m.name, email: m.email, mobile: m.mobile ?? null, created_by: m.createdBy ?? null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cm', 'managers'] }),
  });
}

export function useDeleteManager() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cm_managers').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cm'] }),
  });
}

// ---- Clients ---------------------------------------------------------------
export function useClients(managerId: string | undefined) {
  return useQuery({
    queryKey: ['cm', 'clients', managerId],
    queryFn: async () => {
      if (!managerId) return [];
      const { data, error } = await supabase
        .from('cm_clients')
        .select('*')
        .eq('manager_id', managerId)
        .order('name', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!managerId,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: { managerId: string; name: string }) => {
      const { data, error } = await supabase
        .from('cm_clients')
        .insert({ manager_id: c.managerId, name: c.name })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['cm', 'clients', v.managerId] }),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; managerId: string }) => {
      const { error } = await supabase.from('cm_clients').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cm'] }),
  });
}

// ---- Projects --------------------------------------------------------------
export function useProjects(clientId: string | undefined) {
  return useQuery({
    queryKey: ['cm', 'projects', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('cm_projects')
        .select('*')
        .eq('client_id', clientId)
        .order('name', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { clientId: string; name: string; description?: string | null }) => {
      const { data, error } = await supabase
        .from('cm_projects')
        .insert({ client_id: p.clientId, name: p.name, description: p.description ?? null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['cm', 'projects', v.clientId] }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; clientId: string }) => {
      const { error } = await supabase.from('cm_projects').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cm'] }),
  });
}

// ---- Documents -------------------------------------------------------------
export function useDocuments(projectId: string | undefined) {
  return useQuery({
    queryKey: ['cm', 'documents', projectId],
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

// Upload a file into the bucket, then register it as a document.
export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { file: File; projectId: string; title?: string; uploadedBy?: string | null }) => {
      const ext = v.file.name.split('.').pop()?.toLowerCase() ?? null;
      const path = `${v.projectId}/${Date.now()}_${v.file.name}`;

      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, v.file);
      if (upErr) throw upErr;

      const { data, error } = await supabase
        .from('cm_documents')
        .insert({
          project_id: v.projectId,
          title: v.title?.trim() || v.file.name,
          source: 'upload',
          file_path: path,
          file_type: ext,
          file_size: v.file.size,
          uploaded_by: v.uploadedBy ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['cm', 'documents', v.projectId] }),
  });
}

// Register an external link (Google Docs / Slides / SharePoint / …).
export function useAddLinkDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: {
      projectId: string;
      title: string;
      linkUrl: string;
      fileType?: string | null;
      uploadedBy?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('cm_documents')
        .insert({
          project_id: v.projectId,
          title: v.title,
          source: 'link',
          link_url: v.linkUrl,
          file_type: v.fileType ?? guessLinkType(v.linkUrl),
          uploaded_by: v.uploadedBy ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['cm', 'documents', v.projectId] }),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (doc: { id: string; projectId: string; source: string; filePath: string | null }) => {
      if (doc.source === 'upload' && doc.filePath) {
        await supabase.storage.from(BUCKET).remove([doc.filePath]);
      }
      const { error } = await supabase.from('cm_documents').delete().eq('id', doc.id);
      if (error) throw error;
      return doc;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['cm', 'documents', v.projectId] }),
  });
}

// Returns an opener for a document: signed URL for uploads, the raw link otherwise.
export function useOpenDocument() {
  return async (doc: Pick<ClientDocument, 'source' | 'file_path' | 'link_url'>): Promise<string> => {
    if (doc.source === 'link') return doc.link_url ?? '';
    if (!doc.file_path) return '';
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(doc.file_path, 3600);
    return data?.signedUrl ?? '';
  };
}

// ---- Search ----------------------------------------------------------------
// Searches across manager name/email, client name, project name and the
// document title. Empty query returns nothing (the UI shows the browser instead).
export function useDocumentSearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ['cm', 'search', q],
    queryFn: async (): Promise<DocSearchRow[]> => {
      const like = `%${q.replace(/[%_]/g, (m) => `\\${m}`)}%`;
      const { data, error } = await supabase
        .from('v_cm_documents')
        .select('*')
        .or(
          [
            `manager_name.ilike.${like}`,
            `manager_email.ilike.${like}`,
            `client_name.ilike.${like}`,
            `project_name.ilike.${like}`,
            `title.ilike.${like}`,
          ].join(','),
        )
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
    enabled: q.length > 0,
  });
}

function guessLinkType(url: string): string | null {
  const u = url.toLowerCase();
  if (u.includes('docs.google.com/presentation')) return 'gslides';
  if (u.includes('docs.google.com/spreadsheets')) return 'gsheets';
  if (u.includes('docs.google.com/document')) return 'gdoc';
  if (u.includes('docs.google.com') || u.includes('drive.google.com')) return 'gdrive';
  if (u.includes('sharepoint.com') || u.includes('onedrive')) return 'sharepoint';
  return 'link';
}
