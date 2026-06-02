// HP Financial Quarters (HP's fiscal year starts in November)
export const HP_QUARTERS = [
  { value: 'Q1', label: 'Q1 (Nov - Jan)', months: [10, 11, 0], color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { value: 'Q2', label: 'Q2 (Feb - Apr)', months: [1, 2, 3], color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'Q3', label: 'Q3 (May - Jul)', months: [4, 5, 6], color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { value: 'Q4', label: 'Q4 (Aug - Oct)', months: [7, 8, 9], color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
] as const;

// New Business Units (multi-select)
export const BUSINESS_UNITS = [
  { value: 'PC Commercial', label: 'PC Commercial' },
  { value: 'PC Consumer', label: 'PC Consumer' },
  { value: 'HPS', label: 'HPS' },
  { value: 'OPS', label: 'OPS' },
  { value: 'Services', label: 'Services' },
  { value: 'ACS', label: 'ACS' },
  { value: 'Poly', label: 'Poly' },
] as const;

// PBM Names (multi-select)
export const PBM_NAMES = [
  { value: 'Anthony', label: 'Anthony' },
  { value: 'Kevina', label: 'Kevina' },
  { value: 'Lynn', label: 'Lynn' },
  { value: 'Melvin', label: 'Melvin' },
  { value: 'Nawaz', label: 'Nawaz' },
  { value: 'Poh Heng', label: 'Poh Heng' },
  { value: 'Queenie', label: 'Queenie' },
  { value: 'Rick', label: 'Rick' },
  { value: 'Shirley', label: 'Shirley' },
  { value: 'Younis', label: 'Younis' },
  { value: 'Zhen Hao', label: 'Zhen Hao' },
] as const;

export const MARKETS = [
  { value: 'SG', label: 'Singapore' },
  { value: 'PK', label: 'Pakistan' },
  { value: 'SEMC', label: 'SEMC' },
  { value: 'MY', label: 'Malaysia' },
  { value: 'TH', label: 'Thailand' },
  { value: 'ID', label: 'Indonesia' },
  { value: 'PH', label: 'Philippines' },
  { value: 'VN', label: 'Vietnam' },
  { value: 'IN', label: 'India' },
  { value: 'AU', label: 'Australia' },
  { value: 'NZ', label: 'New Zealand' },
] as const;

// New Activity Status progression (single-select)
export const ACTIVITY_STATUSES_V3 = [
  { value: 'Not Start', label: 'Not Start', color: 'bg-muted text-muted-foreground' },
  { value: 'Planning', label: 'Planning', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'Executing', label: 'Executing', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { value: 'Activity Completed', label: 'Activity Completed', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'Claiming', label: 'Claiming', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { value: 'POE Submitted', label: 'POE Submitted', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  { value: 'Payment Documentation', label: 'Payment Documentation', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  { value: 'Payment Submitted', label: 'Payment Submitted', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
  { value: 'Paid', label: 'Paid', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
] as const;

// Legacy statuses for backward compatibility
export const ACTIVITY_STATUSES = [
  { value: 'Briefing', label: 'Briefing', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  { value: 'Alignment', label: 'Alignment', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'Executing', label: 'Executing', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { value: 'POE Collection', label: 'POE Collection', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { value: 'Review', label: 'Review', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  { value: 'Synced', label: 'Synced', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
] as const;

export const LEGACY_STATUSES = [
  { value: 'Not Started', label: 'Not Started', color: 'bg-muted text-muted-foreground' },
  { value: 'Planning', label: 'Planning', color: 'bg-primary/10 text-primary' },
  { value: 'Completed', label: 'Completed', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'Claiming', label: 'Claiming', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { value: 'POE Submitted', label: 'POE Submitted', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  { value: 'Paid', label: 'Paid', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
] as const;

export const ALL_STATUSES = [...ACTIVITY_STATUSES, ...LEGACY_STATUSES, ...ACTIVITY_STATUSES_V3];

export const FUNDING_SOURCES = [
  { value: 'HP', label: 'HP' },
  { value: 'Intel', label: 'Intel' },
  { value: 'AMD', label: 'AMD' },
  { value: 'Mixed', label: 'Mixed' },
] as const;

export const ACTIVITY_TYPES = [
  { value: 'Digital Paid Media and Broadcast', label: 'Digital Paid Media and Broadcast' },
  { value: 'Sales Incentives', label: 'Sales Incentives' },
  { value: 'Events and Training', label: 'Events and Training' },
  { value: 'Telemarketing', label: 'Telemarketing' },
  { value: 'Print Marketing', label: 'Print Marketing' },
  { value: 'Customer Assessment', label: 'Customer Assessment' },
  { value: 'Digital Amplifier', label: 'Digital Amplifier' },
  { value: 'In-Store Fixture', label: 'In-Store Fixture' },
  { value: 'Retail Product Packaging', label: 'Retail Product Packaging' },
  { value: 'Retail Activation & Merchandising', label: 'Retail Activation & Merchandising' },
  { value: 'e-Tail Vendor Service', label: 'e-Tail Vendor Service' },
] as const;

export const POE_CATEGORIES = [
  { value: 'Event', label: 'Event' },
  { value: 'Digital', label: 'Digital' },
  { value: 'Incentive', label: 'Sales Incentive' },
  { value: 'Retail', label: 'Retail' },
  { value: 'Training', label: 'Training' },
  { value: 'Content', label: 'Content' },
] as const;

export const CURRENCIES = [
  { value: 'USD', label: 'USD', symbol: '$' },
  { value: 'SGD', label: 'SGD', symbol: 'S$' },
  { value: 'MYR', label: 'MYR', symbol: 'RM' },
  { value: 'THB', label: 'THB', symbol: '฿' },
  { value: 'IDR', label: 'IDR', symbol: 'Rp' },
  { value: 'PHP', label: 'PHP', symbol: '₱' },
  { value: 'VND', label: 'VND', symbol: '₫' },
  { value: 'INR', label: 'INR', symbol: '₹' },
  { value: 'AUD', label: 'AUD', symbol: 'A$' },
  { value: 'PKR', label: 'PKR', symbol: '₨' },
] as const;

export const USER_ROLES = [
  { value: 'Super Admin', label: 'Super Admin', navAccess: ['all'] },
  { value: 'Agency Director', label: 'Agency Director', navAccess: ['all'] },
  { value: 'Ops', label: 'Operations', navAccess: ['dashboard', 'activities', 'poe', 'financials', 'team'] },
  { value: 'Project Lead', label: 'Project Lead', navAccess: ['dashboard', 'activities', 'poe', 'partners'] },
  { value: 'PMM', label: 'PMM', navAccess: ['dashboard', 'activities'] },
  { value: 'PBM', label: 'PBM', navAccess: ['dashboard', 'activities'] },
  { value: 'Partner', label: 'Partner', navAccess: ['dashboard', 'activities'] },
  { value: 'Client', label: 'Client', navAccess: ['dashboard'] },
] as const;

export const CREATIVE_ASSET_TYPES = [
  { value: 'Banner', label: 'Banner' },
  { value: 'Email', label: 'Email' },
  { value: 'Social', label: 'Social Media' },
  { value: 'Video', label: 'Video' },
  { value: 'Landing Page', label: 'Landing Page' },
  { value: 'Other', label: 'Other' },
] as const;

export const PRIORITY_LEVELS = [
  { value: 'Low', label: 'Low', color: 'bg-slate-100 text-slate-600' },
  { value: 'Normal', label: 'Normal', color: 'bg-blue-100 text-blue-600' },
  { value: 'High', label: 'High', color: 'bg-amber-100 text-amber-600' },
  { value: 'Urgent', label: 'Urgent', color: 'bg-red-100 text-red-600' },
] as const;

// Helper to get current HP fiscal quarter
export function getCurrentHPQuarter(): { quarter: string; year: number } {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  
  if (month >= 10) {
    return { quarter: 'Q1', year: year + 1 };
  } else if (month === 0) {
    return { quarter: 'Q1', year };
  } else if (month >= 1 && month <= 3) {
    return { quarter: 'Q2', year };
  } else if (month >= 4 && month <= 6) {
    return { quarter: 'Q3', year };
  } else {
    return { quarter: 'Q4', year };
  }
}

// Generate HP Activity ID
export function generateActivityId(): string {
  const timestamp = Date.now().toString().slice(-8);
  return `00${timestamp}`;
}

// Get quarter color based on fiscal quarter string
export function getQuarterColor(fiscalQuarter?: string): string {
  if (!fiscalQuarter) return 'bg-muted text-muted-foreground';
  const q = HP_QUARTERS.find(q => fiscalQuarter.includes(q.value));
  return q?.color || 'bg-muted text-muted-foreground';
}

// Activity types that require special POE requirements
export const SPECIAL_POE_ACTIVITY_TYPES = ['Sales Incentives', 'Events and Training'] as const;

// Get status color for the new v3 statuses
export function getStatusV3Color(status?: string): string {
  if (!status) return 'bg-muted text-muted-foreground';
  const s = ACTIVITY_STATUSES_V3.find(s => s.value === status);
  return s?.color || 'bg-muted text-muted-foreground';
}