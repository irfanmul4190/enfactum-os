import { useState, useRef } from 'react';
import { useManagers, useAddManager, useDeleteManager, useClients, useAddClient, useDeleteClient, useProjects, useAddProject, useDeleteProject, useProjectDocuments, useUploadProjectDocument, useDeleteProjectDocument, useDocumentSignedUrl, useCMSearch } from '@/hooks/useClientManager';
import { useEmployee } from '@/contexts/EmployeeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Trash2, Upload, FileText, File, Presentation, ChevronRight, ChevronDown, User, Building2, FolderOpen, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function FileIcon({ type }: { type: string | null }) {
  if (type === 'pdf') return <FileText className="h-4 w-4 text-red-400" />;
  if (type === 'pptx' || type === 'ppt') return <Presentation className="h-4 w-4 text-orange-400" />;
  return <File className="h-4 w-4 text-blue-400" />;
}

function formatSize(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentLibrary() {
  const { employee } = useEmployee();
  const { canWrite } = useAuth();
  const getUrl = useDocumentSignedUrl();

  const [search, setSearch] = useState('');
  const [selectedManagerId, setSelectedManagerId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [expandedManagers, setExpandedManagers] = useState<Set<string>>(new Set());
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());

  // Add forms
  const [addingManager, setAddingManager] = useState(false);
  const [addingClient, setAddingClient] = useState<string | null>(null);
  const [addingProject, setAddingProject] = useState<string | null>(null);
  const [managerForm, setManagerForm] = useState({ name: '', email: '', mobile: '' });
  const [clientForm, setClientForm] = useState({ name: '' });
  const [projectForm, setProjectForm] = useState({ name: '', description: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hooks
  const { data: managers = [], isLoading } = useManagers();
  const { data: clients = [] } = useClients();
  const { data: projects = [] } = useProjects();
  const { data: documents = [] } = useProjectDocuments(selectedProjectId ?? undefined);
  const { data: searchResults = [] } = useCMSearch(search);

  const addManager = useAddManager();
  const deleteManager = useDeleteManager();
  const addClient = useAddClient();
  const deleteClient = useDeleteClient();
  const addProject = useAddProject();
  const deleteProject = useDeleteProject();
  const uploadDoc = useUploadProjectDocument();
  const deleteDoc = useDeleteProjectDocument();

  const toggleManager = (id: string) => {
    setExpandedManagers(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); setSelectedManagerId(null); }
      else { next.add(id); setSelectedManagerId(id); }
      return next;
    });
    setSelectedClientId(null);
    setSelectedProjectId(null);
  };

  const toggleClient = (id: string) => {
    setExpandedClients(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); setSelectedClientId(null); }
      else { next.add(id); setSelectedClientId(id); }
      return next;
    });
    setSelectedProjectId(null);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProjectId) return;
    uploadDoc.mutate(
      { file, projectId: selectedProjectId, uploadedBy: employee?.id },
      {
        onSuccess: () => toast.success(`"${file.name}" uploaded`),
        onError: (err) => toast.error('Upload failed: ' + (err as Error).message),
      }
    );
    e.target.value = '';
  };

  const handleOpenFile = async (filePath: string) => {
    const url = await getUrl(filePath);
    if (url) window.open(url, '_blank');
    else toast.error('Could not get file URL');
  };

  if (isLoading) return (
    <div className="p-6 flex items-center justify-center min-h-[60vh]">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Document Library</h1>
        {canWrite && (
          <Button size="sm" className="h-8 text-xs" onClick={() => setAddingManager(true)}>
            <Plus className="h-3 w-3 mr-1" />Add Manager
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search by manager, client or project..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-8 h-8 text-sm bg-card"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Search Results */}
      {search.length >= 2 && (
        <div className="data-panel space-y-2">
          <p className="text-xs text-muted-foreground">{searchResults.length} results for "{search}"</p>
          {searchResults.length === 0 ? (
            <p className="text-xs text-muted-foreground">No results found.</p>
          ) : searchResults.map((r, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-background">
              <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-muted-foreground">{r.manager_name}</span>
              {r.client_name && <>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-xs">{r.client_name}</span>
              </>}
              {r.project_name && <>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <FolderOpen className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-xs font-medium">{r.project_name}</span>
              </>}
              {r.project_id && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-6 ml-auto"
                  onClick={() => {
                    setSearch('');
                    setSelectedProjectId(r.project_id);
                  }}
                >
                  View files
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {/* Left panel — tree */}
        <div className="col-span-1 space-y-2">

          {/* Add manager form */}
          {addingManager && (
            <div className="border border-border rounded-lg p-3 space-y-2 bg-card">
              <p className="text-xs font-medium">New Manager</p>
              <Input placeholder="Full name *" value={managerForm.name} onChange={e => setManagerForm(f => ({ ...f, name: e.target.value }))} className="h-8 text-xs" />
              <Input placeholder="Email" value={managerForm.email} onChange={e => setManagerForm(f => ({ ...f, email: e.target.value }))} className="h-8 text-xs" />
              <Input placeholder="Mobile" value={managerForm.mobile} onChange={e => setManagerForm(f => ({ ...f, mobile: e.target.value }))} className="h-8 text-xs" />
              <div className="flex gap-2">
                <Button size="sm" className="text-xs h-7" disabled={!managerForm.name.trim() || addManager.isPending}
                  onClick={() => addManager.mutate({ name: managerForm.name, email: managerForm.email || undefined, mobile: managerForm.mobile || undefined }, {
                    onSuccess: () => { toast.success('Manager added'); setAddingManager(false); setManagerForm({ name: '', email: '', mobile: '' }); },
                    onError: err => toast.error((err as Error).message),
                  })}>
                  {addManager.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setAddingManager(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {managers.length === 0 && !addingManager ? (
            <p className="text-xs text-muted-foreground">No managers yet. Add one to get started.</p>
          ) : managers.map(manager => {
            const managerClients = clients.filter(c => c.manager_id === manager.id);
            const isExpanded = expandedManagers.has(manager.id);

            return (
              <div key={manager.id} className="border border-border rounded-lg bg-card overflow-hidden">
                <div className="flex items-center justify-between p-2.5">
                  <button className="flex items-center gap-2 flex-1 min-w-0 text-left" onClick={() => toggleManager(manager.id)}>
                    {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
                    <User className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{manager.name}</p>
                      {manager.email && <p className="text-[10px] text-muted-foreground truncate">{manager.email}</p>}
                      {manager.mobile && <p className="text-[10px] text-muted-foreground">{manager.mobile}</p>}
                    </div>
                  </button>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{managerClients.length}</Badge>
                    {canWrite && (
                      <button onClick={() => deleteManager.mutate(manager.id, { onSuccess: () => toast.success('Removed'), onError: err => toast.error((err as Error).message) })}
                        className="text-muted-foreground hover:text-destructive p-1">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border pl-4 space-y-0.5 py-1">
                    {managerClients.map(client => {
                      const clientProjects = projects.filter(p => p.client_id === client.id);
                      const isClientExpanded = expandedClients.has(client.id);
                      return (
                        <div key={client.id}>
                          <div className="flex items-center justify-between pr-2 py-1">
                            <button className="flex items-center gap-1.5 flex-1 min-w-0 text-left" onClick={() => toggleClient(client.id)}>
                              {isClientExpanded ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                              <Building2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <span className="text-xs truncate">{client.name}</span>
                              <Badge variant="secondary" className="text-[10px] px-1 py-0 ml-1">{clientProjects.length}</Badge>
                            </button>
                            {canWrite && (
                              <button onClick={() => deleteClient.mutate(client.id, { onSuccess: () => toast.success('Removed') })}
                                className="text-muted-foreground hover:text-destructive p-0.5">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>

                          {isClientExpanded && (
                            <div className="pl-4 space-y-0.5 pb-1">
                              {clientProjects.map(project => (
                                <div key={project.id} className="flex items-center justify-between pr-2">
                                  <button
                                    className={cn('flex items-center gap-1.5 flex-1 min-w-0 text-left py-1 rounded px-1 transition-colors',
                                      selectedProjectId === project.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
                                    )}
                                    onClick={() => setSelectedProjectId(project.id)}
                                  >
                                    <FolderOpen className="h-3 w-3 flex-shrink-0" />
                                    <span className="text-xs truncate">{project.name}</span>
                                  </button>
                                  {canWrite && (
                                    <button onClick={() => deleteProject.mutate(project.id, { onSuccess: () => { toast.success('Removed'); if (selectedProjectId === project.id) setSelectedProjectId(null); } })}
                                      className="text-muted-foreground hover:text-destructive p-0.5">
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              ))}

                              {/* Add project form */}
                              {addingProject === client.id ? (
                                <div className="space-y-1.5 pt-1 pr-2">
                                  <Input placeholder="Project name *" value={projectForm.name} onChange={e => setProjectForm(f => ({ ...f, name: e.target.value }))} className="h-7 text-xs" />
                                  <Input placeholder="Description" value={projectForm.description} onChange={e => setProjectForm(f => ({ ...f, description: e.target.value }))} className="h-7 text-xs" />
                                  <div className="flex gap-1">
                                    <Button size="sm" className="text-xs h-6" disabled={!projectForm.name.trim() || addProject.isPending}
                                      onClick={() => addProject.mutate({ name: projectForm.name, client_id: client.id, description: projectForm.description || undefined }, {
                                        onSuccess: () => { toast.success('Project added'); setAddingProject(null); setProjectForm({ name: '', description: '' }); },
                                        onError: err => toast.error((err as Error).message),
                                      })}>Save</Button>
                                    <Button size="sm" variant="ghost" className="text-xs h-6" onClick={() => setAddingProject(null)}>Cancel</Button>
                                  </div>
                                </div>
                              ) : canWrite && (
                                <button onClick={() => setAddingProject(client.id)} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground py-0.5 px-1">
                                  <Plus className="h-3 w-3" />Add project
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Add client form */}
                    {addingClient === manager.id ? (
                      <div className="space-y-1.5 pt-1 pr-2">
                        <Input placeholder="Client name *" value={clientForm.name} onChange={e => setClientForm(f => ({ ...f, name: e.target.value }))} className="h-7 text-xs" />
                        <div className="flex gap-1">
                          <Button size="sm" className="text-xs h-6" disabled={!clientForm.name.trim() || addClient.isPending}
                            onClick={() => addClient.mutate({ name: clientForm.name, manager_id: manager.id }, {
                              onSuccess: () => { toast.success('Client added'); setAddingClient(null); setClientForm({ name: '' }); },
                              onError: err => toast.error((err as Error).message),
                            })}>Save</Button>
                          <Button size="sm" variant="ghost" className="text-xs h-6" onClick={() => setAddingClient(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : canWrite && (
                      <button onClick={() => setAddingClient(manager.id)} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground py-1 px-1">
                        <Plus className="h-3 w-3" />Add client
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right panel — documents */}
        <div className="col-span-2">
          {!selectedProjectId ? (
            <div className="data-panel flex items-center justify-center min-h-[300px]">
              <div className="text-center space-y-2">
                <FolderOpen className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">Select a project to view its files</p>
              </div>
            </div>
          ) : (
            <div className="data-panel space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">
                  {projects.find(p => p.id === selectedProjectId)?.name ?? 'Project'} — Files ({documents.length})
                </h3>
                {canWrite && (
                  <>
                    <Button size="sm" variant="outline" className="text-xs h-7"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadDoc.isPending}>
                      <Upload className="h-3 w-3 mr-1" />
                      {uploadDoc.isPending ? 'Uploading...' : 'Upload'}
                    </Button>
                    <input ref={fileInputRef} type="file"
                      accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.png,.jpg,.jpeg,.mp4,.mov"
                      className="hidden" onChange={handleUpload} />
                  </>
                )}
              </div>

              {documents.length === 0 ? (
                <p className="text-xs text-muted-foreground">No files yet. Upload a document to get started.</p>
              ) : (
                <div className="space-y-2">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-background">
                      <button className="flex items-center gap-2.5 flex-1 min-w-0 text-left hover:opacity-80"
                        onClick={() => doc.file_path && handleOpenFile(doc.file_path)}>
                        <FileIcon type={doc.file_type} />
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{doc.title}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {doc.file_type?.toUpperCase()} {doc.file_size ? `· ${formatSize(doc.file_size)}` : ''}
                            {' · '}{new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </button>
                      {canWrite && (
                        <button onClick={() => doc.file_path && deleteDoc.mutate({ id: doc.id, filePath: doc.file_path!, projectId: doc.project_id! }, {
                          onSuccess: () => toast.success('Removed'),
                          onError: err => toast.error((err as Error).message),
                        })} className="text-muted-foreground hover:text-destructive p-1 flex-shrink-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}