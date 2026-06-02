export type BusinessUnit = 'PC Commercial' | 'PC Consumer' | 'HPS' | 'OPS' | 'Services' | 'ACS' | 'Poly';
export type ActivityStatus = 'Briefing' | 'Alignment' | 'Executing' | 'POE Collection' | 'Review' | 'Synced' | 'Not Started' | 'Planning' | 'Completed' | 'Claiming' | 'POE Submitted' | 'Paid';
export type ActivityStatusV3 = 'Not Start' | 'Planning' | 'Executing' | 'Activity Completed' | 'Claiming' | 'POE Submitted' | 'Payment Documentation' | 'Payment Submitted' | 'Paid';
export type FundingSource = 'HP' | 'Intel' | 'AMD' | 'Mixed';
export type PartnerType = 'Distributor' | 'Reseller';
export type POECategory = 'Event' | 'Digital' | 'Incentive' | 'Retail' | 'Training' | 'Content';
export type POEStatus = 'Pending' | 'Approved' | 'Rejected';
export type AppRole = 'Super Admin' | 'Agency Director' | 'Ops' | 'Project Lead' | 'PMM' | 'PBM' | 'Partner' | 'Client';
export type OnboardingStatus = 'Pending' | 'In Progress' | 'Complete';
export type CreativeAssetType = 'Banner' | 'Email' | 'Social' | 'Video' | 'Landing Page' | 'Other';
export type CreativeStatus = 'Pending Review' | 'Approved' | 'Revision Requested' | 'Rejected';
export type Priority = 'Low' | 'Normal' | 'High' | 'Urgent';

export type ActivityType = 
  | 'Digital Paid Media and Broadcast'
  | 'Sales Incentives'
  | 'Events and Training'
  | 'Telemarketing'
  | 'Print Marketing'
  | 'Customer Assessment'
  | 'Digital Amplifier'
  | 'In-Store Fixture'
  | 'Retail Product Packaging'
  | 'Retail Activation & Merchandising'
  | 'e-Tail Vendor Service';

// Vendor types
export type VendorType = 
  | 'Distributor'
  | 'Reseller'
  | 'Agency'
  | 'Event Company'
  | 'Print House'
  | 'Digital Agency'
  | 'Media Agency'
  | 'Production House'
  | 'Other';

export type VendorRole = 'Primary' | 'Secondary' | 'Support';

export interface Partner {
  id: string;
  name: string;
  type: PartnerType;
  market: string;
  brand_assets_url?: string;
  onboarding_status: OnboardingStatus;
  meta_pixel_id?: string;
  brand_guidelines_uploaded: boolean;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  market: string;
  funding_source?: string;
  contract_url?: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id: string;
  name: string;
  type: VendorType;
  market: string;
  services: string[];
  contact_name?: string;
  contact_email?: string;
  phone?: string;
  meta_pixel_id?: string;
  brand_guidelines_uploaded: boolean;
  onboarding_status: OnboardingStatus;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActivityVendor {
  id: string;
  activity_id: string;
  vendor_id: string;
  role: VendorRole;
  budget_allocation?: number;
  notes?: string;
  created_at: string;
  vendor?: Vendor;
}

export interface TeamMember {
  id: string;
  email: string;
  full_name: string;
  team: string;
  role: string;
  user_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Activity {
  id: string;
  activity_id: string;
  name: string;
  bu: string; // Legacy single value
  bu_array: string[]; // New multi-select array
  pbm_names: string[]; // New PBM names array
  market: string;
  status: ActivityStatus;
  status_v3: ActivityStatusV3; // New status progression
  funding_source: FundingSource;
  approved_budget: number;
  currency: string;
  execution_start_date?: string;
  execution_end_date?: string;
  claim_deadline?: string;
  partner_id?: string;
  client_id?: string;
  project_lead_id?: string;
  assigned_pmm_id?: string;
  assigned_to?: string;
  activity_type?: ActivityType;
  description?: string;
  pdg_synced: boolean;
  fiscal_quarter?: string;
  hp_approval_email_url?: string;
  created_at: string;
  updated_at: string;
  partner?: Partner;
  client?: Client;
  financials?: Financial;
  assigned_team_member?: TeamMember;
  activity_vendors?: ActivityVendor[];
}

export interface Financial {
  id: string;
  activity_id: string;
  approved_budget: number;
  actual_cost: number;
  currency: string;
  poc_required: boolean;
  claim_deadline?: string;
  deviation_explanation?: string;
  created_at: string;
  updated_at: string;
}

export interface POERecord {
  id: string;
  activity_id: string;
  checklist_type: 'Event' | 'Digital' | 'Incentive';
  file_url?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  comments?: string;
  sku_list?: any;
  weekly_sales_reports?: any;
  submitted_by?: string;
  reviewed_by?: string;
  submitted_at?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreativeApproval {
  id: string;
  activity_id: string;
  asset_name: string;
  asset_type: CreativeAssetType;
  asset_url?: string;
  status: CreativeStatus;
  reviewer_id?: string;
  revision_notes?: string;
  priority: Priority;
  submitted_at: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  activity?: Activity;
}

export interface ActivityStakeholder {
  id: string;
  activity_id: string;
  user_id?: string;
  stakeholder_name: string;
  stakeholder_role: string;
  stakeholder_email?: string;
  created_at: string;
}

export interface ActivityTimeline {
  id: string;
  activity_id: string;
  event_type: string;
  event_description: string;
  event_date: string;
  created_by?: string;
  metadata?: any;
  created_at: string;
}

export interface POESubmission {
  id: string;
  activity_id: string;
  category: POECategory;
  checklist_json: Record<string, any>;
  file_attachments: string[];
  status: POEStatus;
  ops_comments?: string;
  submitted_by?: string;
  reviewed_by?: string;
  submitted_at?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  market_access: string[];
  partner_id?: string;
}

export interface ApprovalWorkflow {
  id: string;
  activity_id: string;
  current_tier: number;
  project_lead_approved: boolean;
  project_lead_approved_at?: string;
  director_approved: boolean;
  director_approved_at?: string;
  ops_approved: boolean;
  ops_approved_at?: string;
  pdg_synced: boolean;
  created_at: string;
  updated_at: string;
}

// Deadline risk levels
export type DeadlineRisk = 'safe' | 'at-risk' | 'urgent' | 'overdue';

// Helper function for deadline risk
export function getDeadlineRisk(claimDeadline: string | undefined): DeadlineRisk {
  if (!claimDeadline) return 'safe';
  const now = new Date();
  const deadline = new Date(claimDeadline);
  const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntil < 0) return 'overdue';
  if (daysUntil <= 14) return 'urgent';
  if (daysUntil <= 30) return 'at-risk';
  return 'safe';
}

// Financial deviation check
export function hasFinancialDeviation(approved: number, actual: number): boolean {
  if (approved === 0) return false;
  return ((actual - approved) / approved) > 0.05;
}
