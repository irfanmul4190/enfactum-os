import { useEmployees } from '@/hooks/useEmployees';
import { Users, UserPlus, UserMinus, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StaggerContainer, StaggerItem } from '@/components/motion/MotionPrimitives';

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: employees = [], isLoading } = useEmployees({
    columns: 'id, name, role, status, department, date_of_joining',
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div>;
  }

  const active = employees.filter(e => e.status === 'active').length;
  const onboarding = employees.filter(e => e.status === 'onboarding').length;
  const onLeave = employees.filter(e => e.status === 'on_leave').length;
  const exited = employees.filter(e => e.status === 'exited').length;

  const kpis = [
    { icon: Users, label: 'Active', count: active, color: 'positive' },
    { icon: UserPlus, label: 'Onboarding', count: onboarding, color: 'info' },
    { icon: Clock, label: 'On Leave', count: onLeave, color: 'warning' },
    { icon: UserMinus, label: 'Exited', count: exited, color: 'status-draft' },
  ];

  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))] as string[];
  const deptCounts = departments
    .map(d => ({
      department: d,
      count: employees.filter(e => e.department === d && e.status === 'active').length,
    }))
    .sort((a, b) => b.count - a.count);

  const recentHires = employees
    .filter(e => e.date_of_joining)
    .sort((a, b) => new Date(b.date_of_joining!).getTime() - new Date(a.date_of_joining!).getTime())
    .slice(0, 5);

  return (
    <StaggerContainer className="space-y-6">
      <StaggerItem>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Team overview at a glance</p>
      </StaggerItem>

      <StaggerItem>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map(kpi => (
            <div key={kpi.label} className="kpi-card">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `hsl(var(--${kpi.color}-muted, var(--muted)))` }}>
                  <kpi.icon className="w-4 h-4" style={{ color: `hsl(var(--${kpi.color}, var(--muted-foreground)))` }} />
                </div>
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold mono text-foreground">{kpi.count}</p>
            </div>
          ))}
        </div>
      </StaggerItem>

      <div className="grid md:grid-cols-2 gap-6">
        <StaggerItem>
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">By Department</h3>
            <div className="space-y-3">
              {deptCounts.map(d => (
                <div key={d.department} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{d.department}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 rounded-full" style={{ background: 'hsl(var(--surface-4))' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min((d.count / (active || 1)) * 100, 100)}%`,
                          background: 'hsl(var(--primary))',
                        }}
                      />
                    </div>
                    <span className="text-xs mono text-foreground w-6 text-right">{d.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Recent Hires</h3>
            {recentHires.length === 0 ? (
              <p className="text-sm text-muted-foreground">No employees yet</p>
            ) : (
              <div className="space-y-3">
                {recentHires.map(emp => (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between cursor-pointer hover:bg-muted/30 rounded-lg p-2 -mx-2 transition-colors"
                    onClick={() => navigate(`/people/${emp.id}`)}
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">{emp.role} · {emp.department}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {emp.date_of_joining ? new Date(emp.date_of_joining).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' }) : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </StaggerItem>
      </div>
    </StaggerContainer>
  );
};

export default Dashboard;
