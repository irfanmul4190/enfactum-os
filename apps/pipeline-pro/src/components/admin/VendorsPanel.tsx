import { useState } from 'react';
import { useVendors, useAddVendor, useUpdateVendor, useDeleteVendor } from '@/hooks/useVendors';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Pencil, X, Save, Building2, Mail, Phone, User } from 'lucide-react';
import { toast } from 'sonner';

const EMPTY_FORM = {
  name: '',
  contact_name: '',
  designation: '',
  contact_phone: '',
  contact_email: '',
  country: '',
  services: '',
  payment_terms: '',
  bank_details: '',
  website: '',
  notes: '',
};

export function VendorsPanel() {
  const { data: vendors = [], isLoading } = useVendors();
  const addVendor = useAddVendor();
  const updateVendor = useUpdateVendor();
  const deleteVendor = useDeleteVendor();
  const { canWrite } = useAuth();

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));
  const setEdit = (field: string, value: string) => setEditForm(f => ({ ...f, [field]: value }));

  const handleAdd = () => {
    if (!form.name.trim()) { toast.error('Company name is required'); return; }
    addVendor.mutate(
      {
        name: form.name.trim(),
        contact_name: form.contact_name.trim() || undefined,
        services: form.designation.trim() ? `${form.designation.trim()}${form.services.trim() ? ' | ' + form.services.trim() : ''}` : form.services.trim() || undefined,
        contact_phone: form.contact_phone.trim() || undefined,
        contact_email: form.contact_email.trim() || undefined,
        country: form.country.trim() || undefined,
        payment_terms: form.payment_terms.trim() || undefined,
        bank_details: form.bank_details.trim() || undefined,
        website: form.website.trim() || undefined,
        notes: form.notes.trim() || undefined,
      },
      {
        onSuccess: () => { toast.success('Vendor added'); setForm(EMPTY_FORM); setAdding(false); },
        onError: (err) => toast.error('Failed: ' + (err as Error).message),
      }
    );
  };

  const handleEdit = (vendor: typeof vendors[0]) => {
    setEditingId(vendor.id);
    const [designation, ...rest] = (vendor.services || '').split(' | ');
    setEditForm({
      name: vendor.name,
      contact_name: vendor.contact_name || '',
      designation: designation || '',
      contact_phone: vendor.contact_phone || '',
      contact_email: vendor.contact_email || '',
      country: vendor.country || '',
      services: rest.join(' | ') || '',
      payment_terms: vendor.payment_terms || '',
      bank_details: vendor.bank_details || '',
      website: vendor.website || '',
      notes: vendor.notes || '',
    });
  };

  const handleSaveEdit = (id: string) => {
    if (!editForm.name.trim()) { toast.error('Company name is required'); return; }
    updateVendor.mutate(
      {
        id,
        updates: {
          name: editForm.name.trim(),
          contact_name: editForm.contact_name.trim() || null,
          services: editForm.designation.trim() ? `${editForm.designation.trim()}${editForm.services.trim() ? ' | ' + editForm.services.trim() : ''}` : editForm.services.trim() || null,
          contact_phone: editForm.contact_phone.trim() || null,
          contact_email: editForm.contact_email.trim() || null,
          country: editForm.country.trim() || null,
          payment_terms: editForm.payment_terms.trim() || null,
          bank_details: editForm.bank_details.trim() || null,
          website: editForm.website.trim() || null,
          notes: editForm.notes.trim() || null,
        },
      },
      {
        onSuccess: () => { toast.success('Vendor updated'); setEditingId(null); },
        onError: (err) => toast.error('Failed: ' + (err as Error).message),
      }
    );
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Remove vendor "${name}"?`)) return;
    deleteVendor.mutate(id, {
      onSuccess: () => toast.success('Vendor removed'),
      onError: (err) => toast.error('Failed: ' + (err as Error).message),
    });
  };

  if (isLoading) return <div className="text-xs text-muted-foreground p-2">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Vendors ({vendors.length})</h2>
        {canWrite && !adding && (
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setAdding(true)}>
            <Plus className="h-3 w-3 mr-1" />Add Vendor
          </Button>
        )}
      </div>

      {adding && (
        <div className="border border-border rounded-lg p-4 space-y-3 bg-card">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">New Vendor</p>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Company name *" value={form.name} onChange={e => set('name', e.target.value)} className="h-8 text-xs col-span-2" />
            <Input placeholder="Contact person name" value={form.contact_name} onChange={e => set('contact_name', e.target.value)} className="h-8 text-xs" />
            <Input placeholder="Designation / title" value={form.designation} onChange={e => set('designation', e.target.value)} className="h-8 text-xs" />
            <Input placeholder="Phone" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} className="h-8 text-xs" />
            <Input placeholder="Email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} className="h-8 text-xs" />
            <Input placeholder="Country" value={form.country} onChange={e => set('country', e.target.value)} className="h-8 text-xs" />
            <Input placeholder="Services offered" value={form.services} onChange={e => set('services', e.target.value)} className="h-8 text-xs" />
            <Input placeholder="Payment terms" value={form.payment_terms} onChange={e => set('payment_terms', e.target.value)} className="h-8 text-xs" />
            <Input placeholder="Bank details" value={form.bank_details} onChange={e => set('bank_details', e.target.value)} className="h-8 text-xs" />
            <Input placeholder="Website" value={form.website} onChange={e => set('website', e.target.value)} className="h-8 text-xs" />
            <Input placeholder="Notes" value={form.notes} onChange={e => set('notes', e.target.value)} className="h-8 text-xs col-span-2" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="text-xs h-7" onClick={handleAdd} disabled={addVendor.isPending}>
              {addVendor.isPending ? 'Saving...' : 'Save Vendor'}
            </Button>
            <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => { setAdding(false); setForm(EMPTY_FORM); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {vendors.length === 0 && !adding ? (
          <p className="text-xs text-muted-foreground">No vendors added yet.</p>
        ) : vendors.map(vendor => (
          <div key={vendor.id} className="border border-border rounded-lg bg-card overflow-hidden">
            {editingId === vendor.id ? (
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Company name *" value={editForm.name} onChange={e => setEdit('name', e.target.value)} className="h-8 text-xs col-span-2" />
                  <Input placeholder="Contact person name" value={editForm.contact_name} onChange={e => setEdit('contact_name', e.target.value)} className="h-8 text-xs" />
                  <Input placeholder="Designation / title" value={editForm.designation} onChange={e => setEdit('designation', e.target.value)} className="h-8 text-xs" />
                  <Input placeholder="Phone" value={editForm.contact_phone} onChange={e => setEdit('contact_phone', e.target.value)} className="h-8 text-xs" />
                  <Input placeholder="Email" value={editForm.contact_email} onChange={e => setEdit('contact_email', e.target.value)} className="h-8 text-xs" />
                  <Input placeholder="Country" value={editForm.country} onChange={e => setEdit('country', e.target.value)} className="h-8 text-xs" />
                  <Input placeholder="Services offered" value={editForm.services} onChange={e => setEdit('services', e.target.value)} className="h-8 text-xs" />
                  <Input placeholder="Payment terms" value={editForm.payment_terms} onChange={e => setEdit('payment_terms', e.target.value)} className="h-8 text-xs" />
                  <Input placeholder="Bank details" value={editForm.bank_details} onChange={e => setEdit('bank_details', e.target.value)} className="h-8 text-xs" />
                  <Input placeholder="Website" value={editForm.website} onChange={e => setEdit('website', e.target.value)} className="h-8 text-xs" />
                  <Input placeholder="Notes" value={editForm.notes} onChange={e => setEdit('notes', e.target.value)} className="h-8 text-xs col-span-2" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="text-xs h-7" onClick={() => handleSaveEdit(vendor.id)} disabled={updateVendor.isPending}>
                    <Save className="h-3 w-3 mr-1" />{updateVendor.isPending ? 'Saving...' : 'Save'}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setEditingId(null)}>
                    <X className="h-3 w-3 mr-1" />Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2.5">
                    <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{vendor.name}</span>
                        {vendor.country && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{vendor.country}</Badge>}
                      </div>
                      {vendor.services && (
                        <p className="text-xs text-muted-foreground mt-0.5">{vendor.services}</p>
                      )}
                      {(vendor.contact_name || vendor.contact_email || vendor.contact_phone) && (
                        <div className="flex flex-wrap gap-3 mt-1.5">
                          {vendor.contact_name && (
                            <span className="flex items-center gap-1 text-xs">
                              <User className="h-3 w-3 text-muted-foreground" />{vendor.contact_name}
                            </span>
                          )}
                          {vendor.contact_email && (
                            <a href={`mailto:${vendor.contact_email}`} className="flex items-center gap-1 text-xs text-primary hover:underline">
                              <Mail className="h-3 w-3" />{vendor.contact_email}
                            </a>
                          )}
                          {vendor.contact_phone && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />{vendor.contact_phone}
                            </span>
                          )}
                        </div>
                      )}
                      {vendor.payment_terms && (
                        <p className="text-xs text-muted-foreground mt-1">Payment: {vendor.payment_terms}</p>
                      )}
                      {vendor.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5 italic">{vendor.notes}</p>
                      )}
                    </div>
                  </div>
                  {canWrite && (
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(vendor)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(vendor.id, vendor.name)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}