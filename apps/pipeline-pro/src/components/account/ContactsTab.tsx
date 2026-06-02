import { useState } from 'react';
import { useContacts, useAddContact, useDeleteContact } from '@/hooks/useContacts';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  accountId: string;
}

export function ContactsTab({ accountId }: Props) {
  const { data: contacts = [], isLoading } = useContacts(accountId);
  const addContact = useAddContact();
  const deleteContact = useDeleteContact();
  const { canWrite } = useAuth();

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: '', phone: '' });

  const handleAdd = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    addContact.mutate(
      {
        account_id: accountId,
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        role: form.role.trim() || undefined,
        phone: form.phone.trim() || undefined,
        is_primary: contacts.length === 0,
      },
      {
        onSuccess: () => {
          toast.success('Contact added');
          setForm({ name: '', email: '', role: '', phone: '' });
          setAdding(false);
        },
        onError: (err) => toast.error('Failed: ' + (err as Error).message),
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteContact.mutate(
      { id, accountId },
      {
        onSuccess: () => toast.success('Contact removed'),
        onError: (err) => toast.error('Failed: ' + (err as Error).message),
      }
    );
  };

  if (isLoading) return <div className="text-xs text-muted-foreground p-2">Loading...</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Contacts ({contacts.length})</h3>
        {canWrite && !adding && (
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setAdding(true)}>
            <Plus className="h-3 w-3 mr-1" />Add Contact
          </Button>
        )}
      </div>

      {adding && (
        <div className="border border-border rounded-lg p-3 space-y-2 bg-card">
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Full name *"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="h-8 text-xs"
            />
            <Input
              placeholder="Email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="h-8 text-xs"
            />
            <Input
              placeholder="Role / title"
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="h-8 text-xs"
            />
            <Input
              placeholder="Phone"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="h-8 text-xs"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" className="text-xs h-7" onClick={handleAdd} disabled={addContact.isPending}>
              {addContact.isPending ? 'Saving...' : 'Save'}
            </Button>
            <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => { setAdding(false); setForm({ name: '', email: '', role: '', phone: '' }); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {contacts.length === 0 && !adding ? (
        <p className="text-xs text-muted-foreground">No contacts yet.</p>
      ) : (
        <div className="space-y-2">
          {contacts.map(contact => (
            <div key={contact.id} className="flex items-start justify-between p-2.5 rounded-lg border border-border bg-card">
              <div className="flex items-start gap-2.5">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium">{contact.name}</span>
                    {contact.is_primary && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Primary</Badge>
                    )}
                  </div>
                  {contact.role && <p className="text-xs text-muted-foreground">{contact.role}</p>}
                  <div className="flex gap-3 mt-0.5">
                    {contact.email && <a href={`mailto:${contact.email}`} className="text-xs text-primary hover:underline">{contact.email}</a>}
                    {contact.phone && <span className="text-xs text-muted-foreground">{contact.phone}</span>}
                  </div>
                </div>
              </div>
              {canWrite && (
                <button onClick={() => handleDelete(contact.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}