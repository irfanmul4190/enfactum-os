import { useMemo } from 'react';
import { useEmployees } from '@/hooks/useEmployees';
import { StaggerContainer, StaggerItem } from '@/components/motion/MotionPrimitives';

const SkillsMatrix = () => {
  const { data: employees = [], isLoading } = useEmployees<{
    id: string; name: string; status: string; skills: string[] | null;
  }>({
    columns: 'id, name, status, skills',
    excludeExited: true,
  });

  const allSkills = useMemo(() => {
    const set = new Set<string>();
    employees.forEach(e => e.skills?.forEach(s => set.add(s)));
    return [...set].sort();
  }, [employees]);

  const skillCounts = useMemo(() => {
    const map: Record<string, number> = {};
    allSkills.forEach(s => {
      map[s] = employees.filter(e => e.skills?.includes(s)).length;
    });
    return map;
  }, [allSkills, employees]);

  if (isLoading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div>;

  return (
    <StaggerContainer className="space-y-6">
      <StaggerItem>
        <h1 className="text-2xl font-bold text-foreground">Skills Matrix</h1>
        <p className="text-sm text-muted-foreground">{allSkills.length} skills across {employees.length} people</p>
      </StaggerItem>

      <StaggerItem>
        <div className="glass-card overflow-hidden">
          {allSkills.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No skills data yet. Add skills to employees first.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Skill</th>
                    <th>People</th>
                    <th>Coverage</th>
                    <th>Team Members</th>
                  </tr>
                </thead>
                <tbody>
                  {allSkills.map(skill => (
                    <tr key={skill}>
                      <td className="font-medium text-foreground">{skill}</td>
                      <td className="mono text-foreground">{skillCounts[skill]}</td>
                      <td>
                        <div className="w-20 h-1.5 rounded-full" style={{ background: 'hsl(var(--surface-4))' }}>
                          <div className="h-full rounded-full" style={{ width: `${(skillCounts[skill] / employees.length) * 100}%`, background: 'hsl(var(--primary))' }} />
                        </div>
                      </td>
                      <td className="text-xs text-muted-foreground">
                        {employees.filter(e => e.skills?.includes(skill)).map(e => e.name).join(', ')}
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

export default SkillsMatrix;
