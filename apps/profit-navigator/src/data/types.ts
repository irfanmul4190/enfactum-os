export interface Client {
  client_id: string;
  client_name: string;
  client_legal_name?: string;
  country: string;
  industry: string;
  billing_currency: string;
  payment_terms: string;
  tax_treatment: "Tax Exclusive" | "Tax Inclusive" | "No Tax";
  billing_contact_name?: string;
  billing_contact_email?: string;
  notes?: string;
}

export interface Stakeholder {
  stakeholder_id: string;
  stakeholder_name: string;
  stakeholder_type: string;
  default_payout_model?: string;
  default_payout_value?: number;
  default_payment_trigger?: string;
  notes?: string;
}

export interface InternalResource {
  resource_id: string;
  resource_name: string;
  role: string;
  cost_rate_per_hour: number;
  recharge_rate_per_hour: number;
  active_flag: boolean;
}

export interface Vendor {
  vendor_id: string;
  vendor_name: string;
  category_default?: string;
  currency_default?: string;
  payment_terms_default?: string;
}

export interface Project {
  project_id: string;
  client_id: string;
  project_name: string;
  project_code: string;
  description?: string;
  country_of_delivery: string;
  currency: string;
  start_date: string;
  end_date: string;
  status: string;
  business_type: "Consulting" | "Manpower" | "Marketing Services" | "Impact & Other Platforms" | "Pass Thru";
  commercial_model: "ENFACTUM_LED" | "PARTNER_PASS_THROUGH";
  invoice_model: string;
  revenue_recognition_basis: string;
  contracted_revenue_ex_tax: number;
  margin_target_percent: number;
  // Pass-through fields
  external_partner_stakeholder_id?: string;
  partner_revenue_basis_ex_tax?: number;
  flat_fee_percent?: number;
  pass_through_payout_basis?: "ENFACTUM_NET_REVENUE" | "ENFACTUM_CONTRIBUTION_MARGIN";
  internal_recharge_applies?: boolean;
  recharge_rate_card_id?: string;
  approvals_status: string;
  sales_person?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectStakeholderSplit {
  split_id: string;
  project_id: string;
  stakeholder_id: string;
  role_on_project: string;
  payout_model: string;
  payout_value: number;
  cap_type: string;
  cap_value: number;
  floor_type: string;
  floor_value: number;
  payment_trigger: string;
  payout_amount_computed?: number;
  notes?: string;
}

export interface Timesheet {
  timesheet_id: string;
  project_id: string;
  resource_id: string;
  work_date: string;
  hours: number;
  activity_type: string;
  cost_rate: number;
  cost_amount: number;
  recharge_rate: number;
  recharge_amount: number;
  notes?: string;
  status: string;
  approved_by?: string;
  approved_at?: string;
}

export interface VendorCost {
  vendor_cost_id: string;
  project_id: string;
  vendor_id: string;
  cost_category: string;
  cost_type: string;
  planned_amount: number;
  actual_amount: number;
  invoice_ref?: string;
  invoice_date?: string;
  payment_status: string;
  notes?: string;
}

export interface OtherCost {
  other_cost_id: string;
  project_id: string;
  category: string;
  planned_amount: number;
  actual_amount: number;
  receipt_ref?: string;
  notes?: string;
}

export interface Invoice {
  invoice_id: string;
  project_id: string;
  invoice_no: string;
  invoice_date: string;
  amount_ex_tax: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  paid_date?: string;
  notes?: string;
}

export interface PartnerSettlement {
  settlement_id: string;
  project_id: string;
  external_partner_stakeholder_id: string;
  partner_revenue_basis_ex_tax: number;
  flat_fee_percent: number;
  enfactum_flat_fee_amount: number;
  internal_recharge_amount: number;
  net_payable_to_partner: number;
  settlement_status: string;
  notes?: string;
  approved_by?: string;
  approved_at?: string;
  paid_date?: string;
}

export interface PayoutPreset {
  preset_id: string;
  preset_name: string;
  payout_model: string;
  payout_value: number;
  payment_trigger: string;
  cap_type: string;
  cap_value: number;
  floor_type: string;
  floor_value: number;
}

export interface ProjectFinancials {
  // Common
  revenueUsed: number;
  internalCost: number;
  vendorCost: number;
  otherCost: number;
  grossMargin: number;
  grossMarginPct: number;
  totalPayouts: number;
  netMarginAfterPayouts: number;
  payouts: ComputedPayout[];
  // Pass-through specific
  partnerRevenue?: number;
  flatFeeAmount?: number;
  internalRechargeAmount?: number;
  enfactumNetRevenue?: number;
  enfactumInternalCost?: number;
  contributionMargin?: number;
  partnerNetPayable?: number;
}

export interface ComputedPayout {
  split_id: string;
  stakeholder_id: string;
  stakeholder_name: string;
  role_on_project: string;
  payout_model: string;
  payout_value: number;
  raw_amount: number;
  capped_amount: number;
  floored_amount: number;
  final_amount: number;
}
