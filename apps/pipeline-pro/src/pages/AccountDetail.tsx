import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAccount, useUpdateAccount } from '@/hooks/useAccounts';
import { useDeals } from '@/hooks/useDeals';
import { useEmployee } from '@/contexts/EmployeeContext';
import { useAuth } from '@/contexts/AuthContext';
import { logEvent } from '@/lib/events';
import { formatSGD } from '@/lib/format';
import { StageBadge } from '@/components/StatusBadges';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { ContactsTab } from '@/components/account/ContactsTab';
import { DocumentsTab } from '@/components/account/DocumentsTab';
import { TagsTab } from '@/components/account/TagsTab';
import { AccountProjectsTab } from '@/components/account/AccountProjectsTab';

export default function AccountDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: acc, isLoading } = useAccount(id);
  const { data: allDeals = [] } = useDeals();
  const { employee } = useEmployee();
  const { canWrite } = useAuth();
  const updateAccount = useUpdateAccount();

  const [editingVendors, setEditingVendors] = useState(false);
  const [vendorFlags, setVendorFlags] = useState<Record<string, boolean>>({});

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!acc) return <div className="p-6"><Link to="/accounts" className="text-primary">Back</Link><p className="mt-2">Account not found.</p></div>;

  const accountDeals = allDeals.filter(d => d.account_id === acc.id);
  const currentVendorFlags: Record<string, boolean> = acc.vendor_flags || {};

  const handleStartVendorEdit = () => {
    setVendorFlags({ ...currentVendorFlags });
    setEditingVendors(true);
  };

  const handleSaveVendors = () => {
    const oldFlags = currentVendorFlags;
    updateAccount.mutate(
      { id: acc.id, updates: { vendor_flags: vendorFlags } },
      {
        onSuccess: () => {
          logEvent({
            entity_type: 'account',
            entity_id: acc.id,
            event_type: 'account.updated',
            payload: {
              changed_fields: {
                vendor_flags: { from: oldFlags, to: vendorFlags },
              },
            },
            actor_id: employee?.id,
          });
          toast.success('Vendor partnerships updated');
          setEditingVendors(false);
        },
        onError: (err) => toast.error('Failed to update: ' + (err as Error).message),
      }
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5 animate-fade-in">
      <Link to="/accounts" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3 w-3" />Accounts</Link>

      <div className="data-panel header-stripe">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold">{acc.name}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{acc.industry || 'No industry'}</p>
          </div>
          <div className="flex gap-1.5">
            {acc.tier && <Badge variant={acc.tier === 'A' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">Tier {acc.tier}</Badge>}
            {currentVendorFlags.hp && <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/40 text-amber-400 bg-amber-500/10">HP Partner</Badge>}
            {currentVendorFlags.lenovo && <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/40 text-amber-400 bg-amber-500/10">Lenovo Partner</Badge>}
          </div>
        </div>
        {(acc.primary_contact_name || acc.website) && (
          <div className="mt-3 pt-3 border-t border-border/40 grid grid-cols-2 gap-3 text-xs">
            {acc.primary_contact_name && (
              <div>
                <span className="text-muted-foreground">Primary Contact:</span>
                <span className="ml-1">{acc.primary_contact_name}</span>
                {acc.primary_contact_email && <span className="text-muted-foreground ml-1">({acc.primary_contact_email})</span>}
              </div>
            )}
            {acc.website && (
              <div>
                <span className="text-muted-foreground">Website:</span>
                <a href={acc.website} target="_blank" rel="noopener noreferrer" className="ml-1 text-primary hover:underline">{acc.website}</a>
              </div>
            )}
          </div>
        )}
      </div>

      <Tabs defaultValue="deals">
        <TabsList className="bg-card border">
          <TabsTrigger value="deals">Deals ({accountDeals.length})</TabsTrigger>
<TabsTrigger value="contacts">Client Managers</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
                    <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="vendors">Vendor Partnerships</TabsTrigger>
        </TabsList>

        <TabsContent value="deals" className="mt-3">
          <div className="data-panel overflow-x-auto p-0">
            <table className="w-full table-compact">
              <thead><tr><th className="text-left">Deal</th><th className="text-left">Stage</th><th className="text-right">Value</th><th className="text-center">MDF</th><th className="text-left">Owner</th><th className="text-left">Expected Close</th></tr></thead>
              <tbody>
                {accountDeals.map(d => (
                  <tr key={d.id}>
                    <td><Link to={`/opportunity/${d.id}`} className="text-primary hover:underline">{d.title}</Link></td>
                    <td><StageBadge stage={d.stage || 'Prospect'} /></td>
                    <td className="text-right sgd-value">{formatSGD(d.value ?? 0)}</td>
                    <td className="text-center">{d.mdf_eligible ? <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/40 text-amber-400 bg-amber-500/10">🏷️ MDF</Badge> : '—'}</td>
                    <td className="text-muted-foreground">{d.owner_name}</td>
                    <td className="text-muted-foreground text-xs">{d.expected_close_date || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

<TabsContent value="contacts" className="mt-3">
          <div className="data-panel">
            <ContactsTab accountId={acc.id} />
          </div>
        </TabsContent>
        <TabsContent value="projects" className="mt-3">
          <div className="data-panel">
            <AccountProjectsTab accountId={acc.id} accountName={acc.name} />
          </div>
        </TabsContent>
<TabsContent value="tags" className="mt-3">
          <div className="data-panel">
            <TagsTab accountId={acc.id} />
          </div>
        </TabsContent>

        <TabsContent value="vendors" className="mt-3">
          <div className="data-panel">
            <div className="flex items-center justify-between mb-4">
              <h3 className="consulting-headline">Vendor Partnerships</h3>
              {!editingVendors && (
                <Button size="sm" variant="outline" onClick={handleStartVendorEdit} disabled={!canWrite} className="text-xs h-7">Edit</Button>
              )}
            </div>

            {!editingVendors ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className={currentVendorFlags.hp ? 'text-amber-400' : 'text-muted-foreground'}>
                    {currentVendorFlags.hp ? '✓' : '✗'} HP Partner
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={currentVendorFlags.lenovo ? 'text-amber-400' : 'text-muted-foreground'}>
                    {currentVendorFlags.lenovo ? '✓' : '✗'} Lenovo Partner
                  </span>
                </div>
                {currentVendorFlags.other && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">✓ Other</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { key: 'hp', label: 'HP Partner' },
                  { key: 'lenovo', label: 'Lenovo Partner' },
                  { key: 'other', label: 'Other' },
                ].map(vendor => (
                  <div key={vendor.key} className="flex items-center gap-2">
                    <Checkbox
                      id={`vendor-${vendor.key}`}
                      checked={vendorFlags[vendor.key] ?? false}
                      onCheckedChange={(checked) => setVendorFlags(f => ({ ...f, [vendor.key]: !!checked }))}
                    />
                    <label htmlFor={`vendor-${vendor.key}`} className="text-sm cursor-pointer">{vendor.label}</label>
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSaveVendors} disabled={updateAccount.isPending} className="text-xs h-8">
                    <Save className="h-3 w-3 mr-1" />{updateAccount.isPending ? 'Saving...' : 'Save'}
                  </Button>
                  <Button variant="ghost" onClick={() => setEditingVendors(false)} className="text-xs h-8">Cancel</Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
