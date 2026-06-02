import { Badge } from '@/components/ui/badge';
import { FollowupStatus } from '@/types';

interface FollowupBadgeProps {
  status: FollowupStatus;
}

export function FollowupBadge({ status }: FollowupBadgeProps) {
  const variantMap: Record<FollowupStatus, 'destructive' | 'warning' | 'success' | 'secondary'> = {
    Overdue: 'destructive',
    'Due Soon': 'warning',
    OK: 'success',
    None: 'secondary',
  };
  return <Badge variant={variantMap[status]} className="text-[10px] px-1.5 py-0">{status}</Badge>;
}

interface ConfidenceBadgeProps {
  score: number;
}

export function ConfidenceBadge({ score }: ConfidenceBadgeProps) {
  const variant = score >= 80 ? 'success' : score >= 50 ? 'warning' : 'destructive';
  return <Badge variant={variant} className="text-[10px] px-1.5 py-0 font-mono">{score}</Badge>;
}

interface StageBadgeProps {
  stage: string;
}

const STAGE_COLORS: Record<string, string> = {
  'Prospect': 'bg-[hsl(var(--stage-prospect))]',
  'Secured lead': 'bg-[hsl(var(--stage-secured))]',
  'Pitching': 'bg-[hsl(var(--stage-pitching))]',
  'Proposal sent': 'bg-[hsl(var(--stage-proposal))]',
  'Cold, follow up later': 'bg-[hsl(var(--stage-cold))]',
  'Closed': 'bg-[hsl(var(--stage-closed))]',
  'Lost': 'bg-[hsl(var(--stage-lost))]',
};

export function StageBadge({ stage }: StageBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium`}>
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STAGE_COLORS[stage] || 'bg-muted-foreground'}`} />
      {stage}
    </span>
  );
}

interface StuckBadgeProps {
  stageAgeDays: number;
  slaDays: number;
}

export function StuckBadge({ stageAgeDays, slaDays }: StuckBadgeProps) {
  if (stageAgeDays <= slaDays) return null;
  return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Stuck {stageAgeDays}d</Badge>;
}
