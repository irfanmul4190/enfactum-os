import { useEffect, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ACCESS_MATRIX_APPS } from '@/lib/access-matrix-apps';
import { useLookups, useCreateLookup, type LookupKind } from '@/hooks/useLookups';
import {
  EMPLOYEES_KEY,
  EMPLOYEE_KEY,
  EMPLOYEE_SENSITIVE_KEY,
  useEmployee,
  useEmployeeSensitive,
} from '@/hooks/useEmployees';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Combobox } from '@/components/ui/combobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StaggerContainer, StaggerItem } from '@/components/motion/MotionPrimitives';

const COUNTRIES = ['Singapore', 'India', 'Malaysia'] as const;
const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract'] as const;
const LIFECYCLE_STATUSES = ['new_hire', 'active', 'exit_initiated', 'exited'] as const;

interface ManagerOption { id: string; name: string; email: string }

const blankForm = {
  name: '', email: '', employee_code: '',
  role: '', department: '', designation: '', cost_center: '',
  status: 'active' as string, lifecycle_status: 'active' as string,
  employment_type: 'full_time' as string, country: 'Singapore' as string,
  location: '', date_of_joining: '', date_of_exit: '',
  manager_id: '' as string,
  monthly_ctc: '', phone: '', personal_email: '',
  payboy_employee_id: '', insurance_member_id: '',
  employee_drive_folder_url: '', payslips_folder_url: '',
  insurance_folder_url: '', onboarding_folder_url: '', exit_folder_url: '',
  is_manager: false, is_finance: false, is_hr_admin: false,
  skillsInput: '',
};

const AddEmployee = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { canAdmin } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [form, setForm] = useState(blankForm);
  const [skills, setSkills] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Manager dropdown source: active employees, minus the one being edited.
  const { data: managers = [] } = useQuery({
    queryKey: ['employees', 'managers'],
    queryFn: async (): Promise<ManagerOption[]> => {
      const { data, error } = await db
        .from('employees').select('id, name, email').eq('status', 'active').order('name');
      if (error) throw error;
      return (data as ManagerOption[]) ?? [];
    },
  });
  const managerOptions = id ? managers.filter(m => m.id !== id) : managers;

  // Lookups
  const { data: deptLookups = [] } = useLookups('department');
  const { data: roleLookups = [] } = useLookups('role');
  const { data: desigLookups = [] } = useLookups('designation');
  const createLookup = useCreateLookup();

  // Edit-mode load
  const { data: existing } = useEmployee(isEdit ? id : undefined);
  const { data: sensitive } = useEmployeeSensitive(isEdit ? id : undefined);

  useEffect(() => {
    if (!isEdit || !existing) return;
    setForm(prev => ({
      ...prev,
      name: existing.name ?? '',
      email: existing.email ?? '',
      employee_code: existing.employee_code ?? '',
      role: existing.role ?? '',
      department: existing.department ?? '',
      designation: existing.designation ?? '',
      cost_center: existing.cost_center ?? '',
      status: existing.status ?? 'active',
      lifecycle_status: existing.lifecycle_status ?? 'active',
      employment_type: existing.employment_type ?? 'full_time',
      country: existing.country ?? 'Singapore',
      location: existing.location ?? '',
      date_of_joining: existing.date_of_joining ?? '',
      date_of_exit: existing.date_of_exit ?? '',
      manager_id: existing.manager_id ?? '',
      is_manager: Boolean(existing.is_manager),
      is_finance: Boolean(existing.is_finance),
      is_hr_admin: Boolean(existing.is_hr_admin),
    }));
    setSkills(existing.skills ?? []);
  }, [isEdit, existing]);

  useEffect(() => {
    if (!sensitive) return;
    setForm(prev => ({
      ...prev,
      monthly_ctc: sensitive.monthly_ctc != null ? String(sensitive.monthly_ctc) : '',
      phone: sensitive.phone ?? '',
      personal_email: sensitive.personal_email ?? '',
      payboy_employee_id: sensitive.payboy_employee_id ?? '',
      insurance_member_id: sensitive.insurance_member_id ?? '',
      employee_drive_folder_url: sensitive.employee_drive_folder_url ?? '',
      payslips_folder_url: sensitive.payslips_folder_url ?? '',
      insurance_folder_url: sensitive.insurance_folder_url ?? '',
      onboarding_folder_url: sensitive.onboarding_folder_url ?? '',
      exit_folder_url: sensitive.exit_folder_url ?? '',
    }));
  }, [sensitive]);

  if (!canAdmin) return <Navigate to="/people" replace />;

  const upsertLookup = async (kind: LookupKind, value: string) => {
    try { await createLookup.mutateAsync({ kind, value }); }
    catch (e: any) {
      // If the value already exists (race / case-insensitive dupe), ignore.
      if (!/duplicate|unique/i.test(e?.message ?? '')) throw e;
    }
  };

  const handleSkillInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = form.skillsInput.trim().replace(/,/g, '');
      if (val && !skills.includes(val)) setSkills([...skills, val]);
      setForm({ ...form, skillsInput: '' });
    }
  };
  const removeSkill = (s: string) => setSkills(skills.filter(sk => sk !== s));

  const save = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        name: form.name,
        email: form.email.trim().toLowerCase(),
        employee_code: form.employee_code || null,
        role: form.role,
        department: form.department,
        designation: form.designation || null,
        cost_center: form.cost_center || null,
        status: form.status,
        lifecycle_status: form.lifecycle_status,
        employment_type: form.employment_type,
        country: form.country,
        location: form.location || null,
        date_of_joining: form.date_of_joining || null,
        date_of_exit: form.date_of_exit || null,
        manager_id: form.manager_id || null,
        monthly_ctc: form.monthly_ctc ? parseFloat(form.monthly_ctc) : null,
        phone: form.phone || null,
        personal_email: form.personal_email ? form.personal_email.trim().toLowerCase() : null,
        payboy_employee_id: form.payboy_employee_id || null,
        insurance_member_id: form.insurance_member_id || null,
        employee_drive_folder_url: form.employee_drive_folder_url || null,
        payslips_folder_url: form.payslips_folder_url || null,
        insurance_folder_url: form.insurance_folder_url || null,
        onboarding_folder_url: form.onboarding_folder_url || null,
        exit_folder_url: form.exit_folder_url || null,
        is_manager: form.is_manager,
        is_finance: form.is_finance,
        is_hr_admin: form.is_hr_admin,
        skills,
      };
      if (isEdit) {
        const { error } = await db.from('employees').update(payload).eq('id', id);
        if (error) throw error;
        return { id: id!, created: false };
      }
      const { data, error } = await db.from('employees').insert(payload).select('id').single();
      if (error || !data?.id) throw error ?? new Error('Insert returned no id');

      const accessRows = ACCESS_MATRIX_APPS.map(app => ({
        employee_id: data.id, app, access_level: 'read' as const,
      }));
      const { error: accessErr } = await db.from('employee_app_access')
        .upsert(accessRows, { onConflict: 'employee_id,app' });
      if (accessErr) throw new Error(`Employee created but access seeding failed: ${accessErr.message}`);
      return { id: data.id, created: true };
    },
    onSuccess: async (result) => {
      // Ensure freshly-typed dept/role/designation become canonical lookups.
      if (form.department) await upsertLookup('department', form.department);
      if (form.role) await upsertLookup('role', form.role);
      if (form.designation) await upsertLookup('designation', form.designation);

      qc.invalidateQueries({ queryKey: EMPLOYEES_KEY });
      if (isEdit) {
        qc.invalidateQueries({ queryKey: EMPLOYEE_KEY(id) });
        qc.invalidateQueries({ queryKey: EMPLOYEE_SENSITIVE_KEY(id) });
        toast({ title: 'Employee updated' });
        navigate(`/people/${result.id}`);
      } else {
        toast({ title: 'Employee created', description: 'Default read access granted to all apps.' });
        navigate('/people');
      }
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err?.message ?? String(err), variant: 'destructive' });
    },
  });

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.role || !form.department) {
      toast({ title: 'Missing fields', description: 'Name, email, role and department are required', variant: 'destructive' });
      return;
    }
    if (!form.email.trim().toLowerCase().endsWith('@enfactum.com')) {
      toast({ title: 'Invalid email', description: 'Employee email must end with @enfactum.com', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try { await save.mutateAsync(); } finally { setSaving(false); }
  };

  return (
    <StaggerContainer className="space-y-6 max-w-3xl">
      <StaggerItem>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-muted-foreground mb-2">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <h1 className="text-2xl font-bold text-foreground">{isEdit ? 'Edit Employee' : 'Add Employee'}</h1>
      </StaggerItem>

      <StaggerItem>
        <div className="glass-card p-6 space-y-8">
          <Section title="Identity">
            <Field label="Name *"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Email * (@enfactum.com)"><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="name@enfactum.com" /></Field>
            <Field label="Employee Code"><Input value={form.employee_code} onChange={e => setForm({ ...form, employee_code: e.target.value })} placeholder="EF-001" /></Field>
          </Section>

          <Section title="Job">
            <Field label="Role *">
              <Combobox
                options={roleLookups.map(l => ({ value: l.value }))}
                value={form.role}
                onChange={v => setForm({ ...form, role: v })}
                onCreate={v => upsertLookup('role', v)}
                placeholder="Select or add…"
              />
            </Field>
            <Field label="Department *">
              <Combobox
                options={deptLookups.map(l => ({ value: l.value }))}
                value={form.department}
                onChange={v => setForm({ ...form, department: v })}
                onCreate={v => upsertLookup('department', v)}
                placeholder="Select or add…"
              />
            </Field>
            <Field label="Designation">
              <Combobox
                options={desigLookups.map(l => ({ value: l.value }))}
                value={form.designation}
                onChange={v => setForm({ ...form, designation: v })}
                onCreate={v => upsertLookup('designation', v)}
                placeholder="Select or add…"
              />
            </Field>
            <Field label="Cost Center"><Input value={form.cost_center} onChange={e => setForm({ ...form, cost_center: e.target.value })} placeholder="CC-ENG" /></Field>
          </Section>

          <Section title="Status & Employment">
            <Field label="Status">
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                  <SelectItem value="exited">Exited</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Lifecycle">
              <Select value={form.lifecycle_status} onValueChange={v => setForm({ ...form, lifecycle_status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LIFECYCLE_STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Employment Type">
              <Select value={form.employment_type} onValueChange={v => setForm({ ...form, employment_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Country">
              <Select value={form.country} onValueChange={v => setForm({ ...form, country: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Location"><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Singapore HQ" /></Field>
            <Field label="Manager">
              <Select value={form.manager_id || 'none'} onValueChange={v => setForm({ ...form, manager_id: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="No manager" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— No manager —</SelectItem>
                  {managerOptions.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name} <span className="text-muted-foreground">({m.email})</span></SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Date of Joining"><Input type="date" value={form.date_of_joining} onChange={e => setForm({ ...form, date_of_joining: e.target.value })} /></Field>
            <Field label="Date of Exit"><Input type="date" value={form.date_of_exit} onChange={e => setForm({ ...form, date_of_exit: e.target.value })} /></Field>
          </Section>

          <Section title="Compensation & Contact" subtitle="(visible only to self / HR admin)">
            <Field label="Monthly CTC"><Input type="number" value={form.monthly_ctc} onChange={e => setForm({ ...form, monthly_ctc: e.target.value })} placeholder="0" /></Field>
            <Field label="Phone"><Input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+65 9123 4567" /></Field>
            <Field label="Personal Email" wide><Input type="email" value={form.personal_email} onChange={e => setForm({ ...form, personal_email: e.target.value })} placeholder="optional@gmail.com" /></Field>
          </Section>

          <Section title="HR Records" subtitle="(visible only to self / HR admin)">
            <Field label="Payboy Employee ID"><Input value={form.payboy_employee_id} onChange={e => setForm({ ...form, payboy_employee_id: e.target.value })} /></Field>
            <Field label="Insurance Member ID"><Input value={form.insurance_member_id} onChange={e => setForm({ ...form, insurance_member_id: e.target.value })} /></Field>
            <Field label="Employee Folder (Drive URL)" wide><Input type="url" value={form.employee_drive_folder_url} onChange={e => setForm({ ...form, employee_drive_folder_url: e.target.value })} placeholder="https://drive.google.com/…" /></Field>
            <Field label="Payslips Folder (Drive URL)" wide><Input type="url" value={form.payslips_folder_url} onChange={e => setForm({ ...form, payslips_folder_url: e.target.value })} placeholder="https://drive.google.com/…" /></Field>
            <Field label="Insurance Folder (Drive URL)" wide><Input type="url" value={form.insurance_folder_url} onChange={e => setForm({ ...form, insurance_folder_url: e.target.value })} placeholder="https://drive.google.com/…" /></Field>
            <Field label="Onboarding Folder (Drive URL)" wide><Input type="url" value={form.onboarding_folder_url} onChange={e => setForm({ ...form, onboarding_folder_url: e.target.value })} placeholder="https://drive.google.com/…" /></Field>
            <Field label="Exit Folder (Drive URL)" wide><Input type="url" value={form.exit_folder_url} onChange={e => setForm({ ...form, exit_folder_url: e.target.value })} placeholder="https://drive.google.com/…" /></Field>
          </Section>

          <Section title="HR Flags">
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={form.is_manager} onCheckedChange={v => setForm({ ...form, is_manager: Boolean(v) })} />
                <span className="text-sm text-foreground">Is Manager</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={form.is_finance} onCheckedChange={v => setForm({ ...form, is_finance: Boolean(v) })} />
                <span className="text-sm text-foreground">Is Finance</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={form.is_hr_admin} onCheckedChange={v => setForm({ ...form, is_hr_admin: Boolean(v) })} />
                <span className="text-sm text-foreground">Is HR Admin</span>
              </label>
            </div>
            <p className="sm:col-span-2 text-xs text-muted-foreground">
              These flags drive approval routing inside HR Hub. They are separate from the access matrix
              (which controls who can sign in to which app) — manage that at /admin/people in the launcher.
            </p>
          </Section>

          <Section title="Skills">
            <div className="sm:col-span-2 space-y-3">
              <Input
                value={form.skillsInput}
                onChange={e => setForm({ ...form, skillsInput: e.target.value })}
                onKeyDown={handleSkillInput}
                placeholder="Type a skill, press Enter or comma to add…"
              />
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {skills.map(s => (
                    <span key={s} className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium" style={{ background: 'hsl(var(--info-muted))', color: 'hsl(var(--info))' }}>
                      {s}
                      <button onClick={() => removeSkill(s)} className="hover:text-foreground"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Section>

          <div className="flex gap-3 pt-2 border-t border-border/40">
            <Button onClick={handleSubmit} disabled={saving} className="btn-primary">
              <Save className="w-4 h-4" /> {saving ? 'Saving…' : isEdit ? 'Update' : 'Create'}
            </Button>
            <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
          </div>
        </div>
      </StaggerItem>
    </StaggerContainer>
  );
};

function Section({ title, subtitle, children }: Readonly<{
  title: string; subtitle?: string; children: React.ReactNode;
}>) {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">
        {title}
        {subtitle && <span className="text-xs font-normal text-muted-foreground normal-case tracking-normal ml-2">{subtitle}</span>}
      </h3>
      <div className="grid sm:grid-cols-2 gap-4">{children}</div>
    </section>
  );
}

function Field({ label, wide, children }: Readonly<{
  label: string; wide?: boolean; children: React.ReactNode;
}>) {
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export default AddEmployee;
