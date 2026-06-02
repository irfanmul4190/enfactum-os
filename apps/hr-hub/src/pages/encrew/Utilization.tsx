import { useMemo } from 'react';
import { useEmployees } from '@/hooks/useEmployees';
import { StaggerContainer, StaggerItem } from '@/components/motion/MotionPrimitives';
import { Users, Building2, Calendar, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  AreaChart, Area,
} from 'recharts';

interface Row {
  id: string; name: string; status: string;
  department: string | null; country: string | null;
  date_of_joining: string | null;
}

const TENURE_BUCKETS = [
  { label: '< 6 mo',   min: 0,    max: 0.5 },
  { label: '6 mo–1 yr', min: 0.5,  max: 1   },
  { label: '1–2 yr',    min: 1,    max: 2   },
  { label: '2–5 yr',    min: 2,    max: 5   },
  { label: '5+ yr',     min: 5,    max: 100 },
];

function yearsBetween(from: string, to: Date) {
  return (to.getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
}

const Utilization = () => {
  const { data: employees = [], isLoading } = useEmployees<Row>({
    columns: 'id, name, status, department, country, date_of_joining',
  });

  const active = employees.filter(e => e.status === 'active');
  const today = new Date();

  // Headcount-by-department, active only.
  const deptData = useMemo(() => {
    const map = new Map<string, number>();
    active.forEach(e => {
      const k = e.department || '—';
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    return [...map.entries()]
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count);
  }, [active]);

  // Headcount-by-country, active only.
  const countryData = useMemo(() => {
    const map = new Map<string, number>();
    active.forEach(e => {
      const k = e.country || '—';
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    return [...map.entries()]
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);
  }, [active]);

  // Tenure distribution of active employees.
  const tenureData = useMemo(() => {
    return TENURE_BUCKETS.map(b => ({
      label: b.label,
      count: active.filter(e => {
        if (!e.date_of_joining) return false;
        const y = yearsBetween(e.date_of_joining, today);
        return y >= b.min && y < b.max;
      }).length,
    }));
  }, [active, today]);

  // Hire trend: per-quarter for the last 8 quarters.
  const hireTrendData = useMemo(() => {
    const quarters: { label: string; from: Date; to: Date }[] = [];
    for (let i = 7; i >= 0; i--) {
      const ref = new Date(today.getFullYear(), today.getMonth() - i * 3, 1);
      const q = Math.floor(ref.getMonth() / 3) + 1;
      const from = new Date(ref.getFullYear(), (q - 1) * 3, 1);
      const to = new Date(ref.getFullYear(), q * 3, 1);
      quarters.push({ label: `${ref.getFullYear()} Q${q}`, from, to });
    }
    return quarters.map(q => ({
      label: q.label,
      hires: employees.filter(e => {
        if (!e.date_of_joining) return false;
        const d = new Date(e.date_of_joining);
        return d >= q.from && d < q.to;
      }).length,
    }));
  }, [employees, today]);

  const totalActive = active.length;
  const totalAll = employees.length;
  const avgTenureYears = (() => {
    const withJoin = active.filter(e => e.date_of_joining);
    if (withJoin.length === 0) return 0;
    const sum = withJoin.reduce((acc, e) => acc + yearsBetween(e.date_of_joining!, today), 0);
    return sum / withJoin.length;
  })();
  const newHiresLast90Days = employees.filter(e => {
    if (!e.date_of_joining) return false;
    return yearsBetween(e.date_of_joining, today) <= 0.25;
  }).length;

  if (isLoading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div>;

  const chartColors = {
    primary: 'hsl(var(--primary))',
    grid:    'hsl(var(--border) / 0.4)',
    muted:   'hsl(var(--muted-foreground))',
  };

  return (
    <StaggerContainer className="space-y-6">
      <StaggerItem>
        <h1 className="text-2xl font-bold text-foreground">Utilization</h1>
        <p className="text-sm text-muted-foreground">Team capacity, distribution, and hiring trends.</p>
      </StaggerItem>

      <StaggerItem>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Kpi icon={Users}       label="Active"          value={totalActive} />
          <Kpi icon={Building2}   label="Total Roster"    value={totalAll} />
          <Kpi icon={Calendar}    label="Avg Tenure (yr)" value={avgTenureYears.toFixed(1)} />
          <Kpi icon={TrendingUp}  label="Hires (90d)"     value={newHiresLast90Days} />
        </div>
      </StaggerItem>

      <div className="grid md:grid-cols-2 gap-6">
        <StaggerItem>
          <ChartCard title="Active headcount by department">
            {deptData.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={deptData} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
                  <XAxis type="number" stroke={chartColors.muted} fontSize={11} allowDecimals={false} />
                  <YAxis type="category" dataKey="department" stroke={chartColors.muted} fontSize={11} width={110} />
                  <Tooltip cursor={{ fill: 'hsl(var(--muted) / 0.4)' }} contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" fill={chartColors.primary} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </StaggerItem>

        <StaggerItem>
          <ChartCard title="Active headcount by country">
            {countryData.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={countryData} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
                  <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
                  <XAxis dataKey="country" stroke={chartColors.muted} fontSize={11} />
                  <YAxis stroke={chartColors.muted} fontSize={11} allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'hsl(var(--muted) / 0.4)' }} contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" fill={chartColors.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </StaggerItem>

        <StaggerItem>
          <ChartCard title="Tenure distribution (active)">
            {totalActive === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={tenureData} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
                  <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
                  <XAxis dataKey="label" stroke={chartColors.muted} fontSize={11} />
                  <YAxis stroke={chartColors.muted} fontSize={11} allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'hsl(var(--muted) / 0.4)' }} contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" fill={chartColors.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </StaggerItem>

        <StaggerItem>
          <ChartCard title="Hires per quarter (last 2 yr)">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={hireTrendData} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
                <defs>
                  <linearGradient id="hireGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={chartColors.primary} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={chartColors.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke={chartColors.muted} fontSize={11} />
                <YAxis stroke={chartColors.muted} fontSize={11} allowDecimals={false} />
                <Tooltip cursor={{ stroke: chartColors.primary, strokeOpacity: 0.4 }} contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="hires" stroke={chartColors.primary} fill="url(#hireGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </StaggerItem>
      </div>
    </StaggerContainer>
  );
};

function Kpi({ icon: Icon, label, value }: Readonly<{ icon: typeof Users; label: string; value: number | string }>) {
  return (
    <div className="kpi-card">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.1)' }}>
          <Icon className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold mono text-foreground">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
      {children}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-[260px] flex items-center justify-center text-xs text-muted-foreground">
      No data yet — add employees to populate this chart.
    </div>
  );
}

export default Utilization;
