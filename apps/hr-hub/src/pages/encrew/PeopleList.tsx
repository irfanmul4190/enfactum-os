import { useState, useMemo } from 'react';
import { useEmployees } from '@/hooks/useEmployees';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

const PeopleList = () => {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();
  const { canAdmin } = useAuth();
  const { data: employees = [], isLoading } = useEmployees<{
    id: string; name: string; email: string; role: string | null;
    status: string; department: string | null; designation: string | null;
    date_of_joining: string | null; skills: string[] | null;
  }>({
    columns: 'id, name, email, role, status, department, designation, date_of_joining, skills',
  });

  const departments = useMemo(
    () => [...new Set(employees.map(e => e.department).filter(Boolean))].sort() as string[],
    [employees],
  );

  const filtered = useMemo(() => employees.filter(e => {
    const matchSearch = !search ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      (e.role ?? '').toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'all' || e.department === deptFilter;
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchSearch && matchDept && matchStatus;
  }), [employees, search, deptFilter, statusFilter]);

  if (isLoading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div>;

  return (
    <StaggerContainer className="space-y-6">
      <StaggerItem>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">People</h1>
            <p className="text-sm text-muted-foreground">{employees.length} team members</p>
          </div>
          {canAdmin && (
            <Button onClick={() => navigate('/people/new')} className="btn-primary">
              <UserPlus className="w-4 h-4" /> Add Employee
            </Button>
          )}
        </div>
      </StaggerItem>

      <StaggerItem>
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name or role…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="onboarding">Onboarding</SelectItem>
              <SelectItem value="on_leave">On Leave</SelectItem>
              <SelectItem value="exited">Exited</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </StaggerItem>

      <StaggerItem>
        <div className="glass-card overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No employees found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Skills</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(emp => (
                    <tr key={emp.id} className="cursor-pointer" onClick={() => navigate(`/people/${emp.id}`)}>
                      <td>
                        <p className="font-medium text-foreground hover:underline">{emp.name}</p>
                        <p className="text-xs text-muted-foreground">{emp.email}</p>
                      </td>
                      <td className="text-foreground">{emp.role}</td>
                      <td className="text-muted-foreground">{emp.department}</td>
                      <td>
                        <span
                          className="rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
                          style={{ background: statusBg[emp.status], color: statusColors[emp.status] }}
                        >
                          {emp.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="text-muted-foreground text-xs">
                        {emp.date_of_joining ? new Date(emp.date_of_joining).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="text-muted-foreground text-xs mono">{emp.skills?.length || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </StaggerItem>
    </StaggerContainer>
  );
};

export default PeopleList;
