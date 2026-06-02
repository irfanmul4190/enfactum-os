import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  useLookups, useCreateLookup, useUpdateLookup, useDeleteLookup, type LookupKind, type Lookup,
} from '@/hooks/useLookups';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StaggerContainer, StaggerItem } from '@/components/motion/MotionPrimitives';

const KINDS: { id: LookupKind; label: string; helper: string }[] = [
  { id: 'department', label: 'Departments', helper: 'e.g. Engineering, Sales, People & Culture' },
  { id: 'role', label: 'Roles', helper: 'e.g. Software Engineer, Account Director' },
  { id: 'designation', label: 'Designations', helper: 'e.g. Senior, Lead, Principal' },
];

const EncrewSettings = () => {
  const { canAdmin } = useAuth();
  if (!canAdmin) return <Navigate to="/" replace />;

  return (
    <StaggerContainer className="space-y-6">
      <StaggerItem>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage the lookup values surfaced in the Add Employee form. Editing here does not change
          values already saved on existing employee rows.
        </p>
      </StaggerItem>

      <StaggerItem>
        <Tabs defaultValue="department">
          <TabsList>
            {KINDS.map(k => (
              <TabsTrigger key={k.id} value={k.id}>{k.label}</TabsTrigger>
            ))}
          </TabsList>
          {KINDS.map(k => (
            <TabsContent key={k.id} value={k.id} className="mt-4">
              <LookupTable kind={k.id} helper={k.helper} />
            </TabsContent>
          ))}
        </Tabs>
      </StaggerItem>
    </StaggerContainer>
  );
};

function LookupTable({ kind, helper }: Readonly<{ kind: LookupKind; helper: string }>) {
  const { toast } = useToast();
  const { data: lookups = [], isLoading } = useLookups(kind, { includeInactive: true });
  const create = useCreateLookup();
  const update = useUpdateLookup();
  const remove = useDeleteLookup();
  const [newValue, setNewValue] = useState('');

  const onAdd = async () => {
    const v = newValue.trim();
    if (!v) return;
    try {
      await create.mutateAsync({ kind, value: v });
      setNewValue('');
    } catch (e: any) {
      toast({
        title: 'Could not add',
        description: /duplicate|unique/i.test(e?.message ?? '') ? 'That value already exists.' : (e?.message ?? String(e)),
        variant: 'destructive',
      });
    }
  };

  const onToggle = async (l: Lookup) => {
    try { await update.mutateAsync({ id: l.id, active: !l.active }); }
    catch (e: any) { toast({ title: 'Update failed', description: e?.message ?? String(e), variant: 'destructive' }); }
  };

  const onDelete = async (l: Lookup) => {
    if (!confirm(`Delete "${l.value}"? This cannot be undone.`)) return;
    try {
      await remove.mutateAsync(l.id);
      toast({ title: 'Deleted' });
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e?.message ?? String(e), variant: 'destructive' });
    }
  };

  return (
    <div className="glass-card p-6 space-y-5">
      <div className="space-y-2">
        <Label>Add new {kind}</Label>
        <p className="text-xs text-muted-foreground">{helper}</p>
        <div className="flex gap-2">
          <Input
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAdd(); } }}
            placeholder={`New ${kind}…`}
          />
          <Button onClick={onAdd} disabled={!newValue.trim() || create.isPending} className="btn-primary shrink-0">
            <Plus className="w-4 h-4" /> Add
          </Button>
        </div>
      </div>

      <div className="space-y-1 -mx-2">
        {isLoading ? (
          <div className="text-center text-sm text-muted-foreground py-6">Loading…</div>
        ) : lookups.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-6">No {kind} values yet.</div>
        ) : (
          lookups.map(l => (
            <div
              key={l.id}
              className={`flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-muted/30 ${l.active ? '' : 'opacity-50'}`}
            >
              <span className="text-sm text-foreground">{l.value}</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost" size="sm"
                  onClick={() => onToggle(l)}
                  title={l.active ? 'Hide from dropdowns' : 'Show in dropdowns'}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                >
                  {l.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </Button>
                <Button
                  variant="ghost" size="sm"
                  onClick={() => onDelete(l)}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default EncrewSettings;
