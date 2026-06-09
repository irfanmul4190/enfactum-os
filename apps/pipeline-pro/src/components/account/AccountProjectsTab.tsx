import { useState } from 'react';
import { useProjects, useAddProject, useDeleteProject } from '@/hooks/useClientManager';
import { useDeals } from '@/hooks/useDeals';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, FolderOpen, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { formatSGD } from '@/lib/format';

interface Props {
  accountId: string;
  accountName: string;
}

export function AccountProjectsTab({ accountId, accountName }: Props) {
  const { data: allProjects = [], isLoading } = useProjects();
  const { data: deals = [] } = useDeals();
  const addProject = useAddProject();
  const deleteProject = useDeleteProject();
  const { canRead } = useAuth();

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  // Filter projects belonging to clients under this account
  // For now link directly via deal account_id match
  const accountDeals = deals.filter(d => d.account_id === accountId);
  const linkedDealIds = new Set(accountDeals.map(d => d.id));

  // Projects linked to this account via deal_id
  const accountProjects = allProjects.filter(p =>
    p.deal_id && linkedDealIds.has(p.deal_id)
  );

  const handleAdd = () => {
    if (!form.name.trim()) { toast.error('Project name is required'); return; }
    // Link to account by finding first matching deal
    const firstDeal = accountDeals[0];
    addProject.mutate(
      {
        name: form.name.trim(),
        client_id: accountId,
        description: form.description.trim() || undefined,
        deal_id: firstDeal?.id ?? undefined,
      },
      {
        onSuccess: () => {
          toast.success('Project added');
          setForm({ name: '', description: '' });
          setAdding(false);
        },
        onError: (err) => toast.error('Failed: ' + (err as Error).message),
      }
    );
  };

  if (isLoading) return <div className="text-xs text-muted-foreground p-2">Loading...</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Projects under {accountName}</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Projects are work engagements linked to deals for this client.
          </p>
        </div>
        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setAdding(true)}>
          <Plus className="h-3 w-3 mr-1" />Add Project
        </Button>
      </div>

      {adding && (
        <div className="border border-border rounded-lg p-3 space-y-2 bg-background">
          <Input
            placeholder="Project name *"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="h-8 text-xs"
            autoFocus
          />
          <Input
            placeholder="Description (optional)"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="h-8 text-xs"
          />
          <div className="flex gap-2">
            <Button size="sm" className="text-xs h-7" onClick={handleAdd} disabled={addProject.isPending}>
              {addProject.isPending ? 'Saving...' : 'Save'}
            </Button>
            <Button size="sm" variant="ghost" className="text-xs h-7"
              onClick={() => { setAdding(false); setForm({ name: '', description: '' }); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {accountProjects.length === 0 && !adding ? (
        <p className="text-xs text-muted-foreground">
          No projects yet. Add a project to track work engagements for this client.
        </p>
      ) : (
        <div className="space-y-2">
          {accountProjects.map(project => {
            const linkedDeal = accountDeals.find(d => d.id === project.deal_id);
            return (
              <div key={project.id} className="flex items-start justify-between p-2.5 rounded-lg border border-border bg-background">
                <div className="flex items-start gap-2.5">
                  <FolderOpen className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{project.name}</p>
                    {project.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{project.description}</p>
                    )}
                    {linkedDeal && (
                      <div className="flex items-center gap-1 mt-1">
                        <LinkIcon className="h-3 w-3 text-muted-foreground" />
                        <Link to={`/opportunity/${linkedDeal.id}`}
                          className="text-xs text-primary hover:underline">
                          {linkedDeal.title}
                        </Link>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">
                          {linkedDeal.stage}
                        </Badge>
                        {linkedDeal.value && (
                          <span className="text-[10px] text-muted-foreground ml-1">
                            {formatSGD(linkedDeal.value)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteProject.mutate(project.id, {
                    onSuccess: () => toast.success('Project removed'),
                    onError: err => toast.error((err as Error).message),
                  })}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}