import { useState } from 'react';
import { useEmployee } from '@/contexts/EmployeeContext';
import { mockUsers, mockStageRules } from '@/data/mockData';
import { User, UserRole, StageRule, STAGES_ORDERED } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Users, GitBranch, List, Shield, Plus, Pencil, Trash2, Check, X, Save } from 'lucide-react';
import { toast } from 'sonner';
import { VendorsPanel } from '@/components/admin/VendorsPanel';
import { VendorsPanel } from '@/components/admin/VendorsPanel';


type Tab = 'users' | 'stages' | 'dropdowns' | 'vendors';

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  sales_bd: 'Sales / BD',
  delivery: 'Delivery',
  readonly: 'Read-only',
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'destructive',
  sales_bd: 'default',
  delivery: 'secondary',
  readonly: 'outline',
};

// Dropdown categories
const DROPDOWN_CATEGORIES = [
  { key: 'workstream', label: 'Workstreams', values: ['Brand Strategy', 'GTM Strategy', 'Campaign', 'Communications', 'Content', 'Digital', 'PR'] },
  { key: 'source', label: 'Lead Sources', values: ['Inbound', 'Outbound', 'Partner', 'Referral', 'Event', 'Renewal / Expansion'] },
  { key: 'win_reason', label: 'Win Reasons', values: ['Solution fit', 'Speed / responsiveness', 'Relationship', 'Price', 'Innovation', 'Team expertise'] },
  { key: 'loss_reason', label: 'Loss Reasons', values: ['Competitor win', 'Pricing too high', 'No budget', 'No decision', 'Timing', 'Scope mismatch'] },
  { key: 'country', label: 'Countries', values: ['Singapore', 'Malaysia', 'Indonesia', 'Thailand', 'Philippines', 'Vietnam', 'Hong Kong', 'Australia'] },
];

export default function AdminSettings() {
  const { appRole } = useEmployee();
  const [activeTab, setActiveTab] = useState<Tab>('users');

  if (appRole !== 'admin') {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <Shield className="h-10 w-10 text-muted-foreground mx-auto" />
          <h2 className="text-lg font-semibold">Access Restricted</h2>
          <p className="text-sm text-muted-foreground">Admin privileges required.</p>
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
    { key: 'users', label: 'Users', icon: Users },
    { key: 'stages', label: 'Stage Rules', icon: GitBranch },
    { key: 'dropdowns', label: 'Dropdowns', icon: List },
    { key: 'vendors', label: 'Vendors', icon: Building2 },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold">Admin Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage users, stage rules, and dropdown values</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'stages' && <StageRulesTab />}
      {activeTab === 'dropdowns' && <DropdownsTab />}
      {activeTab === 'vendors' && <VendorsPanel />}
    </div>
  );
}

/* ─── Users Tab ─── */

function UsersTab() {
  const [users, setUsers] = useState<User[]>(() => [...mockUsers]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('sales_bd');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('sales_bd');

  const startEdit = (user: User) => {
    setEditingId(user.id);
    setEditRole(user.role);
  };

  const saveEdit = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: editRole, updated_at: new Date().toISOString() } : u));
    setEditingId(null);
    toast.success('User role updated');
  };

  const toggleActive = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, active: !u.active } : u));
    toast.success('User status updated');
  };

  const addUser = () => {
    if (!newName.trim() || !newEmail.trim()) return;
    const id = `u${Date.now()}`;
    setUsers(prev => [...prev, {
      id, name: newName.trim(), email: newEmail.trim(), role: newRole,
      active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }]);
    setNewName('');
    setNewEmail('');
    setNewRole('sales_bd');
    setShowAdd(false);
    toast.success('User added');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="consulting-headline">Team Members</h2>
        <Button size="sm" className="h-8 text-xs" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="h-3 w-3 mr-1" />{showAdd ? 'Cancel' : 'Add User'}
        </Button>
      </div>

      {showAdd && (
        <div className="data-panel flex items-end gap-3">
          <div className="flex-1 space-y-1">
            <label className="section-label">Name</label>
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Full name" className="h-8 text-sm bg-muted" />
          </div>
          <div className="flex-1 space-y-1">
            <label className="section-label">Email</label>
            <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@enfactum.com" className="h-8 text-sm bg-muted" />
          </div>
          <div className="w-36 space-y-1">
            <label className="section-label">Role</label>
            <select value={newRole} onChange={e => setNewRole(e.target.value as UserRole)} className="w-full h-8 rounded-md border border-input bg-muted px-2 text-xs">
              {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <Button size="sm" className="h-8" onClick={addUser}><Check className="h-3 w-3 mr-1" />Save</Button>
        </div>
      )}

      <div className="data-panel overflow-x-auto p-0">
        <table className="w-full table-compact">
          <thead>
            <tr>
              <th className="text-left">Name</th>
              <th className="text-left">Email</th>
              <th className="text-center">Role</th>
              <th className="text-center">Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className={cn(!user.active && 'opacity-50')}>
                <td className="font-medium">{user.name}</td>
                <td className="text-muted-foreground text-xs">{user.email}</td>
                <td className="text-center">
                  {editingId === user.id ? (
                    <div className="flex items-center justify-center gap-1">
                      <select value={editRole} onChange={e => setEditRole(e.target.value as UserRole)} className="h-7 rounded border border-input bg-muted px-1.5 text-xs">
                        {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                      <button onClick={() => saveEdit(user.id)} className="p-1 text-success hover:bg-success/10 rounded"><Check className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setEditingId(null)} className="p-1 text-muted-foreground hover:bg-muted rounded"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ) : (
                    <Badge variant={ROLE_COLORS[user.role] as any} className="text-[10px] px-1.5 py-0">{ROLE_LABELS[user.role]}</Badge>
                  )}
                </td>
                <td className="text-center">
                  <button onClick={() => toggleActive(user.id)} className="transition-colors">
                    <Badge variant={user.active ? 'success' : 'secondary'} className="text-[10px] px-1.5 py-0 cursor-pointer">
                      {user.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </button>
                </td>
                <td className="text-center">
                  <button onClick={() => startEdit(user)} className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Stage Rules Tab ─── */

function StageRulesTab() {
  const [rules, setRules] = useState<StageRule[]>(() => [...mockStageRules]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRule, setEditRule] = useState<Partial<StageRule>>({});

  const startEdit = (rule: StageRule) => {
    setEditingId(rule.id);
    setEditRule({ ...rule });
  };

  const saveRule = () => {
    if (!editingId || !editRule) return;
    setRules(prev => prev.map(r => r.id === editingId ? { ...r, ...editRule, id: r.id, stage_name: r.stage_name } as StageRule : r));
    setEditingId(null);
    setEditRule({});
    toast.success('Stage rule updated');
  };

  return (
    <div className="space-y-4">
      <h2 className="consulting-headline">Stage Rules & SLA Configuration</h2>
      <p className="text-xs text-muted-foreground">Configure probability ranges, SLA days, required artifacts, and recommended tasks for each stage.</p>

      <div className="space-y-3">
        {rules.map(rule => {
          const isEditing = editingId === rule.id;
          return (
            <div key={rule.id} className={cn('data-panel', isEditing && 'ring-1 ring-primary/30')}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold">{rule.stage_name}</h3>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                      {(rule.default_probability * 100).toFixed(0)}% default
                    </Badge>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                      SLA: {rule.sla_days_in_stage}d
                    </Badge>
                  </div>

                  {isEditing ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <label className="section-label">Default Prob %</label>
                        <Input
                          type="number" min={0} max={100} step={5}
                          value={(editRule.default_probability ?? 0) * 100}
                          onChange={e => setEditRule(p => ({ ...p, default_probability: Number(e.target.value) / 100 }))}
                          className="h-8 text-sm bg-muted"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="section-label">Min Prob %</label>
                        <Input
                          type="number" min={0} max={100} step={5}
                          value={(editRule.min_probability ?? 0) * 100}
                          onChange={e => setEditRule(p => ({ ...p, min_probability: Number(e.target.value) / 100 }))}
                          className="h-8 text-sm bg-muted"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="section-label">Max Prob %</label>
                        <Input
                          type="number" min={0} max={100} step={5}
                          value={(editRule.max_probability ?? 0) * 100}
                          onChange={e => setEditRule(p => ({ ...p, max_probability: Number(e.target.value) / 100 }))}
                          className="h-8 text-sm bg-muted"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="section-label">SLA Days</label>
                        <Input
                          type="number" min={1} max={999}
                          value={editRule.sla_days_in_stage ?? 14}
                          onChange={e => setEditRule(p => ({ ...p, sla_days_in_stage: Number(e.target.value) }))}
                          className="h-8 text-sm bg-muted"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Probability Range:</span>
                        <span className="ml-1 font-mono">{(rule.min_probability * 100).toFixed(0)}–{(rule.max_probability * 100).toFixed(0)}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Required Artifacts:</span>
                        <span className="ml-1">{rule.required_artifacts.length > 0 ? rule.required_artifacts.join(', ') : '—'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Recommended Tasks:</span>
                        <span className="ml-1">{rule.recommended_tasks.join(', ') || '—'}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0">
                  {isEditing ? (
                    <div className="flex gap-1">
                      <Button size="sm" className="h-7 text-xs" onClick={saveRule}><Save className="h-3 w-3 mr-1" />Save</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingId(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(rule)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Dropdowns Tab ─── */

function DropdownsTab() {
  const [categories, setCategories] = useState(() =>
    DROPDOWN_CATEGORIES.map(c => ({ ...c, values: [...c.values] }))
  );
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [newValue, setNewValue] = useState('');

  const addValue = (catKey: string) => {
    if (!newValue.trim()) return;
    setCategories(prev => prev.map(c =>
      c.key === catKey ? { ...c, values: [...c.values, newValue.trim()] } : c
    ));
    setNewValue('');
    toast.success('Value added');
  };

  const removeValue = (catKey: string, val: string) => {
    setCategories(prev => prev.map(c =>
      c.key === catKey ? { ...c, values: c.values.filter(v => v !== val) } : c
    ));
    toast.success('Value removed');
  };

  return (
    <div className="space-y-4">
      <h2 className="consulting-headline">Dropdown Values</h2>
      <p className="text-xs text-muted-foreground">Manage picklist values used across the application.</p>

      <div className="grid gap-4">
        {categories.map(cat => (
          <div key={cat.key} className="data-panel">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">{cat.label}</h3>
              <button
                onClick={() => setEditingCat(editingCat === cat.key ? null : cat.key)}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                {editingCat === cat.key ? 'Done' : 'Edit'}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {cat.values.map(val => (
                <span key={val} className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs bg-muted">
                  {val}
                  {editingCat === cat.key && (
                    <button onClick={() => removeValue(cat.key, val)} className="text-muted-foreground hover:text-destructive transition-colors ml-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
            {editingCat === cat.key && (
              <div className="flex items-center gap-2 mt-3">
                <Input
                  value={newValue}
                  onChange={e => setNewValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addValue(cat.key)}
                  placeholder={`Add ${cat.label.toLowerCase().replace(/s$/, '')}...`}
                  className="h-8 text-sm bg-muted flex-1 max-w-xs"
                />
                <Button size="sm" className="h-8 text-xs" onClick={() => addValue(cat.key)}>
                  <Plus className="h-3 w-3 mr-1" />Add
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
