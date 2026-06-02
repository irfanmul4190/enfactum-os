import { differenceInDays, format, isAfter, isBefore, parseISO } from 'date-fns';

export function formatDate(date: string | Date | null): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy');
}

export function formatShortDate(date: string | Date | null): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d');
}

export function getDaysUntilDeadline(deadline: string | Date | null): number | null {
  if (!deadline) return null;
  const d = typeof deadline === 'string' ? parseISO(deadline) : deadline;
  const now = new Date();
  return differenceInDays(d, now);
}

export function getDeadlineStatus(daysRemaining: number | null): 'safe' | 'warning' | 'danger' | 'expired' {
  if (daysRemaining === null) return 'safe';
  if (daysRemaining < 0) return 'expired';
  if (daysRemaining <= 14) return 'danger';
  if (daysRemaining <= 30) return 'warning';
  return 'safe';
}

export function getDeadlineClass(status: 'safe' | 'warning' | 'danger' | 'expired'): string {
  switch (status) {
    case 'danger':
    case 'expired':
      return 'countdown-danger';
    case 'warning':
      return 'countdown-warning';
    default:
      return 'countdown-safe';
  }
}

export function formatCountdown(daysRemaining: number | null): string {
  if (daysRemaining === null) return '-';
  if (daysRemaining < 0) return `${Math.abs(daysRemaining)}d overdue`;
  if (daysRemaining === 0) return 'Due today';
  if (daysRemaining === 1) return '1 day left';
  return `${daysRemaining} days left`;
}

export function isAtRisk(claimDeadline: string | Date | null): boolean {
  const days = getDaysUntilDeadline(claimDeadline);
  return days !== null && days <= 14 && days >= 0;
}
