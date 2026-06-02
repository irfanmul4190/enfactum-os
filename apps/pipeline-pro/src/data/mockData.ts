import {
  User, Account, Contact, Opportunity, StageHistoryEntry,
  Activity, Artifact, Task, StageRule
} from '@/types';

// Demo/seed data cleared on 2026-05-19. Production data flows from Supabase
// (deals, accounts, employees tables via v_deals view). The fake DBS/Grab/
// Petronas entries previously here were misleading to demo users.

export const mockUsers: User[] = [];
export const mockAccounts: Account[] = [];
export const mockContacts: Contact[] = [];
export const mockOpportunities: Opportunity[] = [];
export const mockTasks: Task[] = [];
export const mockActivities: Activity[] = [];
export const mockArtifacts: Artifact[] = [];
export const mockStageHistory: StageHistoryEntry[] = [];

// Stage rules are configuration, not seed data — kept so the funnel still
// validates required fields and surfaces recommended next actions.
export const mockStageRules: StageRule[] = [
  { id: 'sr1', stage_name: 'Prospect', required_fields: ['opportunity_title', 'opportunity_owner_user_id', 'country', 'workstream', 'account_id'], required_artifacts: [], recommended_tasks: ['Research account', 'Initial outreach'], default_probability: 0.05, min_probability: 0, max_probability: 0.1, sla_days_in_stage: 14 },
  { id: 'sr2', stage_name: 'Secured lead', required_fields: ['account_id'], required_artifacts: [], recommended_tasks: ['Discovery call scheduled', 'Collect requirements'], default_probability: 0.1, min_probability: 0.05, max_probability: 0.25, sla_days_in_stage: 14 },
  { id: 'sr3', stage_name: 'Pitching', required_fields: ['pitch_summary'], required_artifacts: ['Pitch Deck'], recommended_tasks: ['Send deck', 'Schedule pitch meeting', 'Stakeholder mapping'], default_probability: 0.3, min_probability: 0.25, max_probability: 0.5, sla_days_in_stage: 21 },
  { id: 'sr4', stage_name: 'Proposal sent', required_fields: [], required_artifacts: ['Proposal'], recommended_tasks: ['Follow up proposal', 'Commercial negotiation', 'Legal/procurement check'], default_probability: 0.6, min_probability: 0.5, max_probability: 0.9, sla_days_in_stage: 21 },
  { id: 'sr5', stage_name: 'Cold, follow up later', required_fields: [], required_artifacts: [], recommended_tasks: ['Recycle outreach', 'Share relevant case study'], default_probability: 0.1, min_probability: 0, max_probability: 0.3, sla_days_in_stage: 60 },
  { id: 'sr6', stage_name: 'Closed', required_fields: ['close_date', 'outcome_notes', 'win_reason_tags'], required_artifacts: [], recommended_tasks: ['Kickoff handover', 'Create delivery plan'], default_probability: 1.0, min_probability: 1.0, max_probability: 1.0, sla_days_in_stage: 9999 },
  { id: 'sr7', stage_name: 'Lost', required_fields: ['close_date', 'loss_reason_tags', 'outcome_notes'], required_artifacts: [], recommended_tasks: ['Capture learnings', 'Set recycle task (optional)'], default_probability: 0, min_probability: 0, max_probability: 0, sla_days_in_stage: 9999 },
];

export function getUserById(id: string): User | undefined {
  return mockUsers.find(u => u.id === id);
}

export function getAccountById(id: string): Account | undefined {
  return mockAccounts.find(a => a.id === id);
}

export function getContactById(id: string): Contact | undefined {
  return mockContacts.find(c => c.id === id);
}

export function getStageRule(stage: string): StageRule | undefined {
  return mockStageRules.find(r => r.stage_name === stage);
}
