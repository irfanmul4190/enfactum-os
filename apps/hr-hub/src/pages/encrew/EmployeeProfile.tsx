import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  useEmployee, useEmployeeSensitive, useManagerName, useDeleteEmployee,
} from '@/hooks/useEmployees';
import { Certification } from '@/types/encrew';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Eye, EyeOff, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StaggerContainer, StaggerItem } from '@/components/motion/MotionPrimitives';

const statusColors: Record<string, string> = {
  active: 'hsl(var(--positive))',
  onboarding: 'hsl(var(--info))',
  on_leave: 'hsl(var(--warning))',
  exited: 'hsl(var(--muted-foreground))',
};
const statusBg: Record<string, string> = {
  active: 'hsl(var(--positive-muted))',
  onboarding: 'hsl(var(--info-muted))',
  on_leave: 'hsl(var(--warning-muted))',
  exited: 'hsl(var(--muted))',
};

const EmployeeProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canAdmin } = useAuth();
  const { toast } = useToast();
  const [showCtc, setShowCtc] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: emp, isLoading } = useEmployee(id);
  const { data: sensitive } = useEmployeeSensitive(id);
  const { data: managerName } = useManagerName(emp?.manager_id);
  const del = useDeleteEmployee();

  if (isLoading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div>;
  if (!emp) return <div className="flex items-center justify-center h-64 text-muted-foreground">Employee not found</div>;

  const certs = (emp.certifications as Certification[] | null) || [];
  const flags: string[] = [];
  if (emp.is_manager) flags.push('Manager');
  if (emp.is_finance) flags.push('Finance');
  if (emp.is_hr_admin) flags.push('HR Admin');

  const fmtDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
  const fmtEnum = (v?: string | null) => (v ? v.replace(/_/g, ' ') : '—');

  const handleDelete = async () => {
    if (!emp.id) return;
    try {
      await del.mutateAsync(emp.id);
      toast({ title: 'Employee deleted', description: `${emp.name} removed.` });
      navigate('/people');
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e?.message ?? String(e), variant: 'destructive' });
    } finally {
      setConfirmDelete(false);
    }
  };

  const driveLinks: Array<{ label: string; url: string | null | undefined }> = sensitive
    ? [
        { label: 'Employee Folder', url: sensitive.employee_drive_folder_url },
        { label: 'Payslips', url: sensitive.payslips_folder_url },
        { label: 'Insurance', url: sensitive.insurance_folder_url },
        { label: 'Onboarding', url: sensitive.onboarding_folder_url },
        { label: 'Exit', url: sensitive.exit_folder_url },
      ].filter(l => !!l.url)
    : [];

  return (
    <StaggerContainer className="space-y-6">
      <StaggerItem>
        <Button variant="ghost" size="sm" onClick={() => navigate('/people')} className="text-muted-foreground mb-2">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to People
        </Button>
      </StaggerItem>

      <StaggerItem>
        <div className="glass-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-foreground">{emp.name}</h1>
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
                  style={{ background: statusBg[emp.status], color: statusColors[emp.status] }}
                >
                  {emp.status.replace('_', ' ')}
                </span>
                {flags.map(f => (
                  <span key={f} className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                        style={{ background: 'hsl(var(--info-muted))', color: 'hsl(var(--info))' }}>
                    {f}
                  </span>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {emp.designation || emp.role}{emp.department ? ` · ${emp.department}` : ''}
                {emp.country ? ` · ${emp.country}` : ''}
              </p>
              {emp.date_of_joining && (
                <p className="text-xs text-muted-foreground mt-1">Joined {fmtDate(emp.date_of_joining)}</p>
              )}
            </div>
            {canAdmin && (
              <div className="flex gap-2">
                <Button onClick={() => navigate(`/people/${emp.id}/edit`)} className="btn-glass">
                  <Pencil className="w-4 h-4" /> Edit
                </Button>
                <Button variant="ghost" onClick={() => setConfirmDelete(true)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </StaggerItem>

      <StaggerItem>
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="employment">Employment</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="certifications">Certifications</TabsTrigger>
            {sensitive && <TabsTrigger value="records">HR Records</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview">
            <div className="glass-card p-6 mt-4 grid sm:grid-cols-2 gap-6">
              {[
                { label: 'Role', value: emp.role || '—' },
                { label: 'Email', value: emp.email },
                { label: 'Department', value: emp.department || '—' },
                { label: 'Designation', value: emp.designation || '—' },
                { label: 'Employee Code', value: emp.employee_code || '—' },
                { label: 'Manager', value: managerName || '—' },
              ].map(row => (
                <div key={row.label}>
                  <p className="text-xs text-muted-foreground mb-1">{row.label}</p>
                  <p className="text-sm text-foreground">{row.value}</p>
                </div>
              ))}

              {sensitive && (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Monthly CTC</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm mono text-foreground">
                        {showCtc
                          ? sensitive.monthly_ctc != null ? `$${Number(sensitive.monthly_ctc).toLocaleString()}` : '—'
                          : '••••••'}
                      </p>
                      <button onClick={() => setShowCtc(!showCtc)} className="text-muted-foreground hover:text-foreground">
                        {showCtc ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Personal Email</p>
                    <p className="text-sm text-foreground">{sensitive.personal_email || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Phone</p>
                    <p className="text-sm text-foreground">{sensitive.phone || '—'}</p>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="employment">
            <div className="glass-card p-6 mt-4 grid sm:grid-cols-2 gap-6">
              {[
                { label: 'Lifecycle', value: fmtEnum(emp.lifecycle_status) },
                { label: 'Employment Type', value: fmtEnum(emp.employment_type) },
                { label: 'Country', value: emp.country || '—' },
                { label: 'Location', value: emp.location || '—' },
                { label: 'Cost Center', value: emp.cost_center || '—' },
                { label: 'Date of Joining', value: fmtDate(emp.date_of_joining) },
                { label: 'Date of Exit', value: fmtDate(emp.date_of_exit) },
              ].map(row => (
                <div key={row.label}>
                  <p className="text-xs text-muted-foreground mb-1">{row.label}</p>
                  <p className="text-sm text-foreground">{row.value}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="skills">
            <div className="glass-card p-6 mt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Skills ({emp.skills?.length || 0})</h3>
                {canAdmin && (
                  <Button onClick={() => navigate(`/people/${emp.id}/edit`)} size="sm" className="btn-glass text-xs">
                    Edit Skills
                  </Button>
                )}
              </div>
              {emp.skills && emp.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {emp.skills.map(s => (
                    <span key={s} className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: 'hsl(var(--info-muted))', color: 'hsl(var(--info))' }}>
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No skills added yet</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="certifications">
            <div className="glass-card p-6 mt-4">
              <h3 className="text-sm font-semibold text-foreground mb-4">Certifications ({certs.length})</h3>
              {certs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No certifications recorded</p>
              ) : (
                <div className="space-y-3">
                  {certs.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'hsl(var(--surface-3))' }}>
                      <div>
                        <p className="text-sm font-medium text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">Issued by {c.issued_by}</p>
                      </div>
                      <div className="text-right">
                        <span
                          className="rounded-full px-2 py-0.5 text-xs font-semibold capitalize"
                          style={{
                            background: c.status === 'active' ? statusBg.active : c.status === 'expired' ? statusBg.exited : statusBg.onboarding,
                            color: c.status === 'active' ? statusColors.active : c.status === 'expired' ? statusColors.exited : statusColors.onboarding,
                          }}
                        >
                          {c.status}
                        </span>
                        {c.expiry_date && <p className="text-[10px] text-muted-foreground mt-1">Exp: {new Date(c.expiry_date).toLocaleDateString('en-SG', { month: 'short', year: 'numeric' })}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {sensitive && (
            <TabsContent value="records">
              <div className="glass-card p-6 mt-4 space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Payboy Employee ID</p>
                    <p className="text-sm mono text-foreground">{sensitive.payboy_employee_id || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Insurance Member ID</p>
                    <p className="text-sm mono text-foreground">{sensitive.insurance_member_id || '—'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Drive folders</p>
                  {driveLinks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No folders linked yet</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-2">
                      {driveLinks.map(link => (
                        <a
                          key={link.label}
                          href={link.url!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 rounded-xl text-sm hover:bg-muted/40 transition-colors"
                          style={{ background: 'hsl(var(--surface-3))' }}
                        >
                          <span className="text-foreground">{link.label}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </StaggerItem>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {emp.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the employee row and cascades all access-matrix grants. The Supabase Auth user
              (if any) is not deleted — they simply lose access on next sign-in. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </StaggerContainer>
  );
};

export default EmployeeProfile;
