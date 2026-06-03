import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Search, FolderTree, Users, Building2, FolderOpen, FileText, Plus, Upload,
  Link2, Trash2, ChevronRight, ExternalLink, Mail, Phone, ArrowLeft,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { usePerms } from '@/hooks/usePerms';
import { useEmployee } from '@/contexts/EmployeeContext';
import { formatDate } from '@/lib/format';
import {
  useManagers, useCreateManager, useDeleteManager,
  useClients, useCreateClient, useDeleteClient,
  useProjects, useCreateProject, useDeleteProject,
  useDocuments, useUploadDocument, useAddLinkDocument, useDeleteDocument,
  useOpenDocument, useDocumentSearch,
  type Manager, type Client, type Project, type ClientDocument, type DocSearchRow,
} from '@/hooks/useClientDocs';

function formatBytes(bytes: number | null): string {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function typeLabel(t: string | null): string {
  if (!t) return 'file';
  const map: Record<string, string> = {
    gslides: 'Google Slides', gdoc: 'Google Docs', gsheets: 'Google Sheets',
    gdrive: 'Google Drive', sharepoint: 'SharePoint', link: 'Link',
    pdf: 'PDF', pptx: 'PowerPoint', ppt: 'PowerPoint', docx: 'Word', doc: 'Word',
    xlsx: 'Excel', xls: 'Excel',
  };
  return map[t] ?? t.toUpperCase();
}

export default function ClientDocuments() {
  const { canEdit: canWrite, canDelete: canAdmin } = usePerms();
  const [searchParams] = useSearchParams();
  // Deep-link support: /documents?q=Lenovo opens straight into a search
  // (used by the "Open in document library" link from the pipeline).
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '');
  const [manager, setManager] = useState<Manager | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [project, setProject] = useState<Project | null>(null);

  const searching = search.trim().length > 0;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-brand-blue" /> Client Documents
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Files &amp; links organised by Client Manager → Client → Project.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search by manager, client, project or document…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-9 text-sm bg-card"
        />
      </div>

      {searching ? (
        <SearchResults query={search} />
      ) : (
        <Browser
          canWrite={canWrite}
          canAdmin={canAdmin}
          manager={manager}
          client={client}
          project={project}
          setManager={(m) => { setManager(m); setClient(null); setProject(null); }}
          setClient={(c) => { setClient(c); setProject(null); }}
          setProject={setProject}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Search results
// ---------------------------------------------------------------------------
function SearchResults({ query }: { query: string }) {
  const { data = [], isLoading } = useDocumentSearch(query);
  const open = useOpenDocument();

  const openDoc = async (row: DocSearchRow) => {
    const url = await open({ source: row.source ?? 'upload', file_path: row.file_path, link_url: row.link_url });
    if (url) window.open(url, '_blank', 'noopener');
    else toast.error('Could not open document');
  };

  if (isLoading) return <p className="text-xs text-muted-foreground">Searching…</p>;
  if (data.length === 0) return <p className="text-xs text-muted-foreground">No documents match “{query}”.</p>;

  return (
    <div className="data-panel overflow-x-auto p-0">
      <table className="w-full table-compact">
        <thead>
          <tr>
            <th className="text-left">Document</th>
            <th className="text-left">Type</th>
            <th className="text-left">Project</th>
            <th className="text-left">Client</th>
            <th className="text-left">Manager</th>
            <th className="text-left">Added</th>
            <th className="text-center">Open</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id ?? ''}>
              <td className="font-medium">
                <div className="flex items-center gap-1.5">
                  <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm">{row.title}</span>
                </div>
              </td>
              <td><Badge variant="outline" className="text-[10px] px-1.5 py-0">{typeLabel(row.file_type)}</Badge></td>
              <td className="text-muted-foreground text-sm">{row.project_name}</td>
              <td className="text-muted-foreground text-sm">{row.client_name}</td>
              <td className="text-muted-foreground text-sm">
                <div>{row.manager_name}</div>
                <div className="text-[10px]">{row.manager_email}</div>
              </td>
              <td className="text-muted-foreground text-xs">{formatDate(row.created_at ?? undefined)}</td>
              <td className="text-center">
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" title="Open" onClick={() => openDoc(row)}>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Browser (breadcrumb drill-down)
// ---------------------------------------------------------------------------
interface BrowserProps {
  canWrite: boolean;
  canAdmin: boolean;
  manager: Manager | null;
  client: Client | null;
  project: Project | null;
  setManager: (m: Manager | null) => void;
  setClient: (c: Client | null) => void;
  setProject: (p: Project | null) => void;
}

function Browser(props: BrowserProps) {
  const { manager, client, project, setManager, setClient, setProject } = props;

  return (
    <div className="space-y-3">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm flex-wrap">
        <button className="text-primary hover:underline" onClick={() => setManager(null)}>Managers</button>
        {manager && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <button className={client ? 'text-primary hover:underline' : 'font-medium'} onClick={() => setClient(null)}>{manager.name}</button>
          </>
        )}
        {client && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <button className={project ? 'text-primary hover:underline' : 'font-medium'} onClick={() => setProject(null)}>{client.name}</button>
          </>
        )}
        {project && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">{project.name}</span>
          </>
        )}
      </div>

      {!manager && <ManagersList {...props} />}
      {manager && !client && <ClientsList {...props} manager={manager} />}
      {manager && client && !project && <ProjectsList {...props} client={client} />}
      {project && <DocumentsList {...props} project={project} />}
    </div>
  );
}

// Small reusable "add" dialog with up to three text fields.
function AddDialog({
  open, onClose, title, fields, onSubmit, submitLabel = 'Add',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  fields: { key: string; label: string; type?: string; required?: boolean; multiline?: boolean; placeholder?: string }[];
  onSubmit: (values: Record<string, string>) => Promise<void> | void;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const close = () => { setValues({}); onClose(); };

  const submit = async () => {
    for (const f of fields) {
      if (f.required && !values[f.key]?.trim()) { toast.error(`${f.label} is required`); return; }
    }
    setSaving(true);
    try {
      await onSubmit(values);
      setValues({});
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Fill in the details below.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {fields.map((f) => (
            <div key={f.key} className="space-y-1">
              <label className="text-xs font-medium">{f.label}{f.required && ' *'}</label>
              {f.multiline ? (
                <Textarea
                  value={values[f.key] ?? ''}
                  placeholder={f.placeholder}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                />
              ) : (
                <Input
                  type={f.type ?? 'text'}
                  value={values[f.key] ?? ''}
                  placeholder={f.placeholder}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                />
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? 'Saving…' : submitLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDelete({ open, onClose, label, onConfirm }: { open: boolean; onClose: () => void; label: string; onConfirm: () => void }) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {label}?</AlertDialogTitle>
          <AlertDialogDescription>
            This also removes everything nested inside it. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---- Managers -------------------------------------------------------------
function ManagersList(props: BrowserProps) {
  const { canWrite, canAdmin, setManager } = props;
  const { data: managers = [], isLoading } = useManagers();
  const create = useCreateManager();
  const del = useDeleteManager();
  const { employee } = useEmployee();
  const [adding, setAdding] = useState(false);
  const [delTarget, setDelTarget] = useState<Manager | null>(null);

  return (
    <>
      <SectionHeader
        icon={Users} title="Client Managers" count={managers.length}
        action={canWrite && <Button size="sm" className="h-7 text-xs" onClick={() => setAdding(true)}><Plus className="h-3 w-3 mr-1" />Add Manager</Button>}
      />
      {isLoading ? <Loading /> : managers.length === 0 ? (
        <Empty text="No client managers yet." />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {managers.map((m) => (
            <Row key={m.id} onClick={() => setManager(m)} onDelete={canAdmin ? () => setDelTarget(m) : undefined}>
              <Users className="h-4 w-4 text-brand-blue flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{m.name}</div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-0.5"><Mail className="h-3 w-3" />{m.email}</span>
                  {m.mobile && <span className="flex items-center gap-0.5"><Phone className="h-3 w-3" />{m.mobile}</span>}
                </div>
              </div>
            </Row>
          ))}
        </div>
      )}

      <AddDialog
        open={adding} onClose={() => setAdding(false)} title="Add Client Manager"
        fields={[
          { key: 'name', label: 'Name', required: true, placeholder: 'Phil Tan' },
          { key: 'email', label: 'Email', type: 'email', required: true, placeholder: 'ptan@lenovo.com' },
          { key: 'mobile', label: 'Mobile', placeholder: '+65 9123 4567' },
        ]}
        onSubmit={async (v) => {
          await create.mutateAsync({ name: v.name.trim(), email: v.email.trim(), mobile: v.mobile?.trim() || null, createdBy: employee?.id ?? null });
          toast.success('Manager added');
        }}
      />
      <ConfirmDelete
        open={!!delTarget} onClose={() => setDelTarget(null)} label={delTarget?.name ?? 'manager'}
        onConfirm={async () => { if (!delTarget) return; try { await del.mutateAsync(delTarget.id); toast.success('Manager deleted'); } catch (e) { toast.error((e as Error).message); } setDelTarget(null); }}
      />
    </>
  );
}

// ---- Clients --------------------------------------------------------------
function ClientsList(props: BrowserProps & { manager: Manager }) {
  const { canWrite, canAdmin, manager, setClient } = props;
  const { data: clients = [], isLoading } = useClients(manager.id);
  const create = useCreateClient();
  const del = useDeleteClient();
  const [adding, setAdding] = useState(false);
  const [delTarget, setDelTarget] = useState<Client | null>(null);

  return (
    <>
      <SectionHeader
        icon={Building2} title={`Clients of ${manager.name}`} count={clients.length}
        action={canWrite && <Button size="sm" className="h-7 text-xs" onClick={() => setAdding(true)}><Plus className="h-3 w-3 mr-1" />Add Client</Button>}
      />
      {isLoading ? <Loading /> : clients.length === 0 ? (
        <Empty text="No clients yet." />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {clients.map((c) => (
            <Row key={c.id} onClick={() => setClient(c)} onDelete={canAdmin ? () => setDelTarget(c) : undefined}>
              <Building2 className="h-4 w-4 text-brand-blue flex-shrink-0" />
              <span className="text-sm font-medium truncate flex-1">{c.name}</span>
            </Row>
          ))}
        </div>
      )}

      <AddDialog
        open={adding} onClose={() => setAdding(false)} title="Add Client"
        fields={[{ key: 'name', label: 'Client name', required: true, placeholder: 'Lenovo' }]}
        onSubmit={async (v) => { await create.mutateAsync({ managerId: manager.id, name: v.name.trim() }); toast.success('Client added'); }}
      />
      <ConfirmDelete
        open={!!delTarget} onClose={() => setDelTarget(null)} label={delTarget?.name ?? 'client'}
        onConfirm={async () => { if (!delTarget) return; try { await del.mutateAsync({ id: delTarget.id, managerId: manager.id }); toast.success('Client deleted'); } catch (e) { toast.error((e as Error).message); } setDelTarget(null); }}
      />
    </>
  );
}

// ---- Projects -------------------------------------------------------------
function ProjectsList(props: BrowserProps & { client: Client }) {
  const { canWrite, canAdmin, client, setProject } = props;
  const { data: projects = [], isLoading } = useProjects(client.id);
  const create = useCreateProject();
  const del = useDeleteProject();
  const [adding, setAdding] = useState(false);
  const [delTarget, setDelTarget] = useState<Project | null>(null);

  return (
    <>
      <SectionHeader
        icon={FolderOpen} title={`Projects for ${client.name}`} count={projects.length}
        action={canWrite && <Button size="sm" className="h-7 text-xs" onClick={() => setAdding(true)}><Plus className="h-3 w-3 mr-1" />Add Project</Button>}
      />
      {isLoading ? <Loading /> : projects.length === 0 ? (
        <Empty text="No projects yet." />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {projects.map((p) => (
            <Row key={p.id} onClick={() => setProject(p)} onDelete={canAdmin ? () => setDelTarget(p) : undefined}>
              <FolderOpen className="h-4 w-4 text-brand-blue flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{p.name}</div>
                {p.description && <div className="text-[11px] text-muted-foreground truncate">{p.description}</div>}
              </div>
            </Row>
          ))}
        </div>
      )}

      <AddDialog
        open={adding} onClose={() => setAdding(false)} title="Add Project"
        fields={[
          { key: 'name', label: 'Project name', required: true, placeholder: 'Q1 Campaign' },
          { key: 'description', label: 'Description', multiline: true, placeholder: 'Optional notes' },
        ]}
        onSubmit={async (v) => { await create.mutateAsync({ clientId: client.id, name: v.name.trim(), description: v.description?.trim() || null }); toast.success('Project added'); }}
      />
      <ConfirmDelete
        open={!!delTarget} onClose={() => setDelTarget(null)} label={delTarget?.name ?? 'project'}
        onConfirm={async () => { if (!delTarget) return; try { await del.mutateAsync({ id: delTarget.id, clientId: client.id }); toast.success('Project deleted'); } catch (e) { toast.error((e as Error).message); } setDelTarget(null); }}
      />
    </>
  );
}

// ---- Documents ------------------------------------------------------------
function DocumentsList(props: BrowserProps & { project: Project }) {
  const { canWrite, canAdmin, project, setProject } = props;
  const { data: docs = [], isLoading } = useDocuments(project.id);
  const upload = useUploadDocument();
  const addLink = useAddLinkDocument();
  const del = useDeleteDocument();
  const open = useOpenDocument();
  const { employee } = useEmployee();
  const [linking, setLinking] = useState(false);
  const [delTarget, setDelTarget] = useState<ClientDocument | null>(null);
  const [uploading, setUploading] = useState(false);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await upload.mutateAsync({ file, projectId: project.id, uploadedBy: employee?.id ?? null });
      }
      toast.success(files.length > 1 ? `${files.length} files uploaded` : 'File uploaded');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const openDoc = async (doc: ClientDocument) => {
    const url = await open(doc);
    if (url) window.open(url, '_blank', 'noopener');
    else toast.error('Could not open document');
  };

  return (
    <>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setProject(null)}>
          <ArrowLeft className="h-3 w-3 mr-1" /> Back to projects
        </Button>
        {canWrite && (
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline" className="h-7 text-xs cursor-pointer" disabled={uploading}>
              <label>
                <Upload className="h-3 w-3 mr-1" />{uploading ? 'Uploading…' : 'Upload files'}
                <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
              </label>
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={() => setLinking(true)}>
              <Link2 className="h-3 w-3 mr-1" /> Add link
            </Button>
          </div>
        )}
      </div>

      {isLoading ? <Loading /> : docs.length === 0 ? (
        <Empty text="No documents yet. Upload a file or add a link." />
      ) : (
        <div className="data-panel overflow-x-auto p-0">
          <table className="w-full table-compact">
            <thead>
              <tr>
                <th className="text-left">Document</th>
                <th className="text-left">Type</th>
                <th className="text-left">Source</th>
                <th className="text-left">Size</th>
                <th className="text-left">Added</th>
                <th className="text-center">Open</th>
                {canAdmin && <th className="text-center">Delete</th>}
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id}>
                  <td className="font-medium">
                    <div className="flex items-center gap-1.5">
                      {d.source === 'link' ? <Link2 className="h-3 w-3 text-muted-foreground flex-shrink-0" /> : <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
                      <span className="text-sm">{d.title}</span>
                    </div>
                  </td>
                  <td><Badge variant="outline" className="text-[10px] px-1.5 py-0">{typeLabel(d.file_type)}</Badge></td>
                  <td><Badge variant="secondary" className="text-[10px] px-1.5 py-0">{d.source === 'link' ? 'Link' : 'Upload'}</Badge></td>
                  <td className="text-muted-foreground text-xs">{formatBytes(d.file_size)}</td>
                  <td className="text-muted-foreground text-xs">{formatDate(d.created_at)}</td>
                  <td className="text-center">
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" title="Open" onClick={() => openDoc(d)}><ExternalLink className="h-3 w-3" /></Button>
                  </td>
                  {canAdmin && (
                    <td className="text-center">
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" title="Delete" onClick={() => setDelTarget(d)}><Trash2 className="h-3 w-3" /></Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddDialog
        open={linking} onClose={() => setLinking(false)} title="Add document link" submitLabel="Add link"
        fields={[
          { key: 'title', label: 'Title', required: true, placeholder: 'Q1 Strategy Deck' },
          { key: 'url', label: 'URL', required: true, placeholder: 'https://docs.google.com/presentation/…' },
        ]}
        onSubmit={async (v) => { await addLink.mutateAsync({ projectId: project.id, title: v.title.trim(), linkUrl: v.url.trim(), uploadedBy: employee?.id ?? null }); toast.success('Link added'); }}
      />
      <ConfirmDelete
        open={!!delTarget} onClose={() => setDelTarget(null)} label={delTarget?.title ?? 'document'}
        onConfirm={async () => { if (!delTarget) return; try { await del.mutateAsync({ id: delTarget.id, projectId: project.id, source: delTarget.source, filePath: delTarget.file_path }); toast.success('Document deleted'); } catch (e) { toast.error((e as Error).message); } setDelTarget(null); }}
      />
    </>
  );
}

// ---- Shared bits ----------------------------------------------------------
function SectionHeader({ icon: Icon, title, count, action }: { icon: typeof Users; title: string; count: number; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-sm font-semibold flex items-center gap-1.5">
        <Icon className="h-4 w-4 text-muted-foreground" /> {title}
        <span className="text-xs text-muted-foreground font-normal">({count})</span>
      </h2>
      {action}
    </div>
  );
}

function Row({ children, onClick, onDelete }: { children: React.ReactNode; onClick: () => void; onDelete?: () => void }) {
  return (
    <div className="data-panel flex items-center gap-2 px-3 py-2 hover:bg-muted/50 transition-colors group">
      <button className="flex items-center gap-2 min-w-0 flex-1 text-left" onClick={onClick}>{children}</button>
      {onDelete && (
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive opacity-0 group-hover:opacity-100" title="Delete" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
    </div>
  );
}

function Loading() {
  return <p className="text-xs text-muted-foreground">Loading…</p>;
}

function Empty({ text }: { text: string }) {
  return <div className="data-panel py-8 text-center text-xs text-muted-foreground">{text}</div>;
}
