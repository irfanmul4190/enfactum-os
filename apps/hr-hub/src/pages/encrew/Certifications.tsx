import { useMemo } from 'react';
import { useEmployees } from '@/hooks/useEmployees';
import { Certification } from '@/types/encrew';
import { StaggerContainer, StaggerItem } from '@/components/motion/MotionPrimitives';
import { Award, AlertTriangle, CheckCircle } from 'lucide-react';

const Certifications = () => {
  const { data: employees = [], isLoading } = useEmployees<{
    id: string; name: string; status: string; certifications: unknown;
  }>({
    columns: 'id, name, status, certifications',
    excludeExited: true,
  });

  const allCerts = useMemo(() => {
    const list: { emp: { id: string; name: string }; cert: Certification }[] = [];
    employees.forEach(emp => {
      const certs = (emp.certifications as Certification[] | null) || [];
      certs.forEach(cert => list.push({ emp, cert }));
    });
    return list;
  }, [employees]);

  const activeCerts = allCerts.filter(c => c.cert.status === 'active').length;
  const expiredCerts = allCerts.filter(c => c.cert.status === 'expired').length;
  const pendingCerts = allCerts.filter(c => c.cert.status === 'pending').length;

  if (isLoading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div>;

  return (
    <StaggerContainer className="space-y-6">
      <StaggerItem>
        <h1 className="text-2xl font-bold text-foreground">Certifications</h1>
        <p className="text-sm text-muted-foreground">Track team certifications and renewals</p>
      </StaggerItem>

      <StaggerItem>
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: CheckCircle, label: 'Active', count: activeCerts, color: 'positive' },
            { icon: AlertTriangle, label: 'Expired', count: expiredCerts, color: 'warning' },
            { icon: Award, label: 'Pending', count: pendingCerts, color: 'info' },
          ].map(kpi => (
            <div key={kpi.label} className="kpi-card">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `hsl(var(--${kpi.color}-muted))` }}>
                  <kpi.icon className="w-3.5 h-3.5" style={{ color: `hsl(var(--${kpi.color}))` }} />
                </div>
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <p className="text-xl font-bold mono text-foreground">{kpi.count}</p>
            </div>
          ))}
        </div>
      </StaggerItem>

      <StaggerItem>
        <div className="glass-card overflow-hidden">
          {allCerts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No certifications data. Add certifications to employee profiles.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead><tr><th>Employee</th><th>Certification</th><th>Issued By</th><th>Expiry</th><th>Status</th></tr></thead>
                <tbody>
                  {allCerts.map((c, i) => (
                    <tr key={i}>
                      <td className="text-foreground">{c.emp.name}</td>
                      <td className="font-medium text-foreground">{c.cert.name}</td>
                      <td className="text-muted-foreground">{c.cert.issued_by}</td>
                      <td className="text-muted-foreground text-xs">
                        {c.cert.expiry_date ? new Date(c.cert.expiry_date).toLocaleDateString('en-SG', { month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td>
                        <span
                          className="rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
                          style={{
                            background: c.cert.status === 'active' ? 'hsl(var(--positive-muted))' : c.cert.status === 'expired' ? 'hsl(var(--warning-muted))' : 'hsl(var(--info-muted))',
                            color: c.cert.status === 'active' ? 'hsl(var(--positive))' : c.cert.status === 'expired' ? 'hsl(var(--warning))' : 'hsl(var(--info))',
                          }}
                        >
                          {c.cert.status}
                        </span>
                      </td>
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

export default Certifications;
