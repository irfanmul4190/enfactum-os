export interface EncrewEmployee {
  id: string;
  auth_user_id: string | null;
  name: string;
  email: string;
  role: string;
  department: string;
  designation: string;
  status: 'active' | 'onboarding' | 'on_leave' | 'exited';
  date_of_joining: string | null;
  date_of_exit: string | null;
  monthly_ctc: number | null;
  skills: string[] | null;
  certifications: Certification[] | null;
  metadata: Record<string, unknown> | null;
}

export interface Certification {
  name: string;
  issued_by: string;
  expiry_date: string | null;
  status: 'active' | 'expired' | 'pending';
}

export interface AuditLog {
  module: string;
  entity_type: string;
  event_type: string;
  actor_id: string;
  entity_id?: string;
  payload?: Record<string, unknown>;
  created_at?: string;
}
