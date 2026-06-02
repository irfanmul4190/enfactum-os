// Core data types for Enfactum Funnel Management

export type UserRole = 'admin' | 'sales_bd' | 'delivery' | 'readonly';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type Tier = 'A' | 'B' | 'C';
export type ICPFit = 'High' | 'Medium' | 'Low';

export interface Account {
  id: string;
  account_name: string;
  country: string;
  sector?: string;
  website?: string;
  notes?: string;
  tier: Tier;
  icp_fit: ICPFit;
  strategic_logo: boolean;
  parent_account?: string;
  last_activity_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  account_id: string;
  contact_name: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type Stage = 'Prospect' | 'Secured lead' | 'Pitching' | 'Proposal sent' | 'Cold, follow up later' | 'Closed' | 'Lost';

export type FollowupStatus = 'Overdue' | 'Due Soon' | 'OK' | 'None';
export type OutcomeStatus = 'Won' | 'Lost' | 'No Decision';
export type Source = 'Inbound' | 'Outbound' | 'Partner' | 'Referral' | 'Event' | 'Renewal / Expansion';

export interface Opportunity {
  id: string;
  opportunity_title: string;
  account_id: string;
  primary_contact_id?: string;
  primary_contact_free_text?: string;
  country: string;
  workstream: string;
  stage: Stage;
  est_value_sgd: number;
  probability_system: number;
  probability_override?: number;
  probability_override_reason?: string;
  relationship_owner_user_id?: string;
  opportunity_owner_user_id: string;
  notes?: string;
  pitch_summary?: string;
  source?: Source;
  tags: string[];
  last_activity_at?: string;
  created_at: string;
  updated_at: string;
  // Governance
  blocker_note?: string;
  deck_not_required?: boolean;
  deck_exception_reason?: string;
  proposal_not_required?: boolean;
  proposal_exception_reason?: string;
  // Deal review
  close_date?: string;
  expected_close_month?: string;
  competitors?: string[];
  outcome_status?: OutcomeStatus;
  win_reason_tags?: string[];
  loss_reason_tags?: string[];
  outcome_notes?: string;
}

// Computed fields helper
export function getEffectiveProbability(opp: Opportunity): number {
  return opp.probability_override ?? opp.probability_system;
}

export function getWeightedValue(opp: Opportunity, useEffective = true): number {
  const prob = useEffective ? getEffectiveProbability(opp) : opp.probability_system;
  return opp.est_value_sgd * prob;
}

export function getStageAgeDays(opp: Opportunity, stageHistory: StageHistoryEntry[]): number {
  const lastChange = stageHistory
    .filter(s => s.opportunity_id === opp.id)
    .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime())[0];
  if (!lastChange) {
    return Math.floor((Date.now() - new Date(opp.created_at).getTime()) / (1000 * 60 * 60 * 24));
  }
  return Math.floor((Date.now() - new Date(lastChange.changed_at).getTime()) / (1000 * 60 * 60 * 24));
}

export function getConfidenceScore(
  opp: Opportunity,
  tasks: Task[],
  activities: Activity[],
  artifacts: Artifact[],
  stageRule?: StageRule
): number {
  let score = 0;
  // +40 if required fields complete
  if (opp.opportunity_title && opp.opportunity_owner_user_id && opp.account_id && opp.stage) score += 40;
  // +30 if required artifacts present or exception
  if (stageRule) {
    const reqArtifacts = stageRule.required_artifacts || [];
    const hasAll = reqArtifacts.every(type =>
      artifacts.some(a => a.opportunity_id === opp.id && a.artifact_type === type)
    );
    const hasException = (opp.deck_not_required && opp.deck_exception_reason) ||
      (opp.proposal_not_required && opp.proposal_exception_reason);
    if (reqArtifacts.length === 0 || hasAll || hasException) score += 30;
  } else {
    score += 30;
  }
  // +20 if any activity in last 14 days
  const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
  if (activities.some(a => a.opportunity_id === opp.id && new Date(a.activity_date).getTime() > twoWeeksAgo)) score += 20;
  // +10 if open task with due date not overdue
  const now = new Date();
  if (tasks.some(t => t.opportunity_id === opp.id && t.status === 'Open' && t.due_date && new Date(t.due_date) >= now)) score += 10;
  return score;
}

export function getFollowupStatus(tasks: Task[], opportunityId: string): FollowupStatus {
  const oppTasks = tasks.filter(t => t.opportunity_id === opportunityId && t.status === 'Open');
  if (oppTasks.length === 0) return 'None';
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const hasOverdue = oppTasks.some(t => t.due_date && new Date(t.due_date) < now);
  if (hasOverdue) return 'Overdue';
  const hasDueSoon = oppTasks.some(t => t.due_date && new Date(t.due_date) <= sevenDaysFromNow);
  if (hasDueSoon) return 'Due Soon';
  return 'OK';
}

export interface StageHistoryEntry {
  id: string;
  opportunity_id: string;
  from_stage: Stage;
  to_stage: Stage;
  changed_by_user_id: string;
  changed_at: string;
}

export type ActivityType = 'Call' | 'Meeting' | 'Email' | 'Note' | 'Proposal Sent' | 'Deck Shared' | 'Other';

export interface Activity {
  id: string;
  opportunity_id: string;
  activity_type: ActivityType;
  activity_date: string;
  summary: string;
  details?: string;
  created_by_user_id: string;
  created_at: string;
}

export type ArtifactType = 'Pitch Deck' | 'Proposal' | 'SOW' | 'Email' | 'Case Study' | 'Pricing' | 'Other';
export type PitchType = 'Capability Deck' | 'Proposal' | 'SOW' | 'Campaign Plan' | 'GTM Plan' | 'Workshop Pitch' | 'Pricing' | 'Case Study' | 'Other';

export interface Artifact {
  id: string;
  opportunity_id: string;
  account_id: string;
  artifact_type: ArtifactType;
  pitch_type: PitchType;
  industry?: string;
  keywords: string[];
  title: string;
  file_url: string;
  version?: string;
  shared_with_client: boolean;
  created_by_user_id: string;
  created_at: string;
}

export type TaskStatus = 'Open' | 'Done' | 'Deferred';
export type TaskType = 'Call' | 'Email' | 'Meeting' | 'Prep' | 'Send' | 'Review' | 'Other';

export interface Task {
  id: string;
  opportunity_id: string;
  account_id: string;
  task_type: TaskType;
  title: string;
  due_date: string;
  status: TaskStatus;
  owner_user_id: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface StageRule {
  id: string;
  stage_name: Stage;
  required_fields: string[];
  required_artifacts: ArtifactType[];
  recommended_tasks: string[];
  default_probability: number;
  min_probability: number;
  max_probability: number;
  sla_days_in_stage: number;
}

export interface SettingsDropdown {
  id: string;
  type: string;
  value: string;
  active: boolean;
}

export const STAGES_ORDERED: Stage[] = [
  'Prospect',
  'Secured lead',
  'Pitching',
  'Proposal sent',
  'Cold, follow up later',
  'Closed',
  'Lost',
];

export const STAGE_COLOR_MAP: Record<Stage, string> = {
  'Prospect': 'stage-prospect',
  'Secured lead': 'stage-secured',
  'Pitching': 'stage-pitching',
  'Proposal sent': 'stage-proposal',
  'Cold, follow up later': 'stage-cold',
  'Closed': 'stage-closed',
  'Lost': 'stage-lost',
};
