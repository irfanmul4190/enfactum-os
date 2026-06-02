import { useMemo, useState } from 'react';
import { useDeals } from '@/hooks/useDeals';
import { formatDate } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, FileText, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StageBadge } from '@/components/StatusBadges';
import { Link } from 'react-router-dom';
import { mockArtifacts, getAccountById, getUserById } from '@/data/mockData';
import { mockOpportunities } from '@/data/mockData';

export default function PitchLibrary() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Still using mock artifacts as they don't have a DB table yet
  const enriched = useMemo(() => {
    return mockArtifacts.map(a => {
      const opp = mockOpportunities.find(o => o.id === a.opportunity_id);
      return { ...a, opp, account: getAccountById(a.account_id), creator: getUserById(a.created_by_user_id) };
    });
  }, []);

  const filtered = useMemo(() => {
    let result = enriched;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        a.title.toLowerCase().includes(q) || a.account?.account_name.toLowerCase().includes(q) ||
        a.opp?.opportunity_title.toLowerCase().includes(q) || a.keywords.some(k => k.toLowerCase().includes(q))
      );
    }
    if (typeFilter !== 'all') result = result.filter(a => a.pitch_type === typeFilter);
    return result;
  }, [enriched, search, typeFilter]);

  const pitchTypes = [...new Set(mockArtifacts.map(a => a.pitch_type))];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold">Pitch Library</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Search and reuse pitch artifacts across accounts.</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search artifacts, accounts, keywords..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-sm bg-card" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="h-8 rounded-md border border-input bg-card px-2.5 text-xs">
          <option value="all">All pitch types</option>
          {pitchTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="data-panel overflow-x-auto p-0">
        <table className="w-full table-compact">
          <thead>
            <tr>
              <th className="text-left">Title</th>
              <th className="text-left">Type</th>
              <th className="text-left">Pitch Type</th>
              <th className="text-left">Account</th>
              <th className="text-left">Opportunity</th>
              <th className="text-left">Stage</th>
              <th className="text-left">Keywords</th>
              <th className="text-left">Created</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id}>
                <td className="font-medium">
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm">{a.title}</span>
                  </div>
                </td>
                <td><Badge variant="outline" className="text-[10px] px-1.5 py-0">{a.artifact_type}</Badge></td>
                <td><Badge variant="secondary" className="text-[10px] px-1.5 py-0">{a.pitch_type}</Badge></td>
                <td className="text-muted-foreground text-sm">{a.account?.account_name}</td>
                <td>{a.opp && <Link to={`/opportunity/${a.opp.id}`} className="text-primary hover:underline text-sm">{a.opp.opportunity_title}</Link>}</td>
                <td>{a.opp && <StageBadge stage={a.opp.stage} />}</td>
                <td><div className="flex gap-0.5 flex-wrap">{a.keywords.slice(0, 2).map(k => <Badge key={k} variant="outline" className="text-[9px] px-1 py-0">{k}</Badge>)}</div></td>
                <td className="text-muted-foreground text-xs">{formatDate(a.created_at)}</td>
                <td className="text-center"><Button size="sm" variant="ghost" className="h-6 w-6 p-0" title="Reuse"><Copy className="h-3 w-3" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
