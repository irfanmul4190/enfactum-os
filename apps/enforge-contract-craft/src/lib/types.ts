export interface Contract {
  id: string;
  title: string;
  type: string;
  status: string;
  deal_id: string | null;
  account_id: string | null;
  owner_id: string | null;
  value: number | null;
  currency: string | null;
  payment_terms: string | null;
  start_date: string | null;
  end_date: string | null;
  auto_renew: boolean;
  renewal_date: string | null;
  scope_summary: string | null;
  deliverables: Deliverable[] | null;
  client_signer_name: string | null;
  client_signer_email: string | null;
  enfactum_signer_id: string | null;
  internal_notes: string | null;
  file_url: string | null;
  signed_file_url: string | null;
  signed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContractView {
  id: string;
  title: string;
  type: string;
  status: string;
  value: number | null;
  currency: string | null;
  start_date: string | null;
  end_date: string | null;
  auto_renew: boolean;
  renewal_date: string | null;
  account_name: string | null;
  account_id: string | null;
  deal_id: string | null;
  deal_title: string | null;
  owner_name: string | null;
  owner_id: string | null;
  scope_summary: string | null;
  deliverables: Deliverable[] | null;
  payment_terms: string | null;
  client_signer_name: string | null;
  client_signer_email: string | null;
  enfactum_signer_id: string | null;
  internal_notes: string | null;
  file_url: string | null;
  signed_file_url: string | null;
  signed_at: string | null;
  created_at: string;
}

export interface Deliverable {
  title: string;
  description?: string;
  completed?: boolean;
}

export interface Deal {
  id: string;
  title: string;
  account_id: string | null;
  account_name?: string;
}

export interface Account {
  id: string;
  name: string;
}

export interface EmployeeOption {
  id: string;
  name: string;
  email: string;
}

export interface ContractEvent {
  id: string;
  module: string;
  entity_type: string;
  entity_id: string;
  event_type: string;
  payload: Record<string, any> | null;
  actor_id: string | null;
  actor_name?: string;
  created_at: string;
}

export type ContractStatus =
  | "draft"
  | "internal_review"
  | "sent_to_client"
  | "client_review"
  | "negotiation"
  | "approved"
  | "signed"
  | "active"
  | "expired";

export type ContractType = "MSA" | "SOW" | "NDA" | "Amendment" | "PO" | "Other";

export const STATUS_PIPELINE: { key: ContractStatus; label: string }[] = [
  { key: "draft", label: "Draft" },
  { key: "internal_review", label: "Internal Review" },
  { key: "sent_to_client", label: "Sent to Client" },
  { key: "client_review", label: "Client Review" },
  { key: "negotiation", label: "Negotiation" },
  { key: "approved", label: "Approved" },
  { key: "signed", label: "Signed" },
  { key: "active", label: "Active" },
];
