import type {
  Client, Stakeholder, InternalResource, Vendor, Project,
  ProjectStakeholderSplit, Timesheet, VendorCost, OtherCost, Invoice, PayoutPreset
} from "./types";

// Demo/seed data cleared on 2026-05-19. The app starts empty and is meant to
// be populated via the on-boarding forms and Supabase. Real client / staff
// names previously shipped here have been removed.

export const clients: Client[] = [];
export const stakeholders: Stakeholder[] = [];
export const resources: InternalResource[] = [];
export const vendors: Vendor[] = [];
export const projects: Project[] = [];
export const projectStakeholderSplits: ProjectStakeholderSplit[] = [];
export const timesheets: Timesheet[] = [];
export const vendorCosts: VendorCost[] = [];
export const otherCosts: OtherCost[] = [];
export const invoices: Invoice[] = [];
export const payoutPresets: PayoutPreset[] = [];

// Dropdown options — kept so onboarding forms still render usable selects.
export const COUNTRIES = ["Singapore", "India", "Malaysia", "Indonesia", "Philippines", "Vietnam", "Thailand", "Japan", "Australia", "Other"];
export const INDUSTRIES = ["Technology", "Government", "BFSI", "Healthcare", "Manufacturing", "Retail", "Education", "Other"];
export const CURRENCIES = ["SGD", "USD", "INR", "MYR", "IDR", "PHP", "VND", "THB", "JPY", "AUD"];
export const PAYMENT_TERMS = ["Net 7", "Net 14", "Net 30", "Net 45", "Net 60"];
export const PROJECT_STATUSES = ["Draft", "Active", "On Hold", "Closed"];
export const COMMERCIAL_MODELS = ["ENFACTUM_LED", "PARTNER_PASS_THROUGH"];
export const INVOICE_MODELS = ["Fixed Fee", "Time & Materials", "Retainer", "Milestone"];
export const STAKEHOLDER_TYPES = ["RAINMAKER", "PROJECT_LEAD", "INTERNAL_PARTNER", "EXTERNAL_PARTNER", "OTHER"];
export const PAYOUT_MODELS = ["PERCENT_OF_REVENUE", "PERCENT_OF_GROSS_MARGIN", "FIXED_AMOUNT", "NONE"];
export const CAP_TYPES = ["NO_CAP", "CAP_AMOUNT", "CAP_PERCENT_OF_REVENUE", "CAP_PERCENT_OF_GROSS_MARGIN"];
export const FLOOR_TYPES = ["NO_FLOOR", "FLOOR_AMOUNT"];
export const PAYMENT_TRIGGERS = ["ON_INVOICE_ISSUED", "ON_CLIENT_PAYMENT_RECEIVED", "ON_PROJECT_CLOSE"];
export const BUSINESS_TYPES = ["Consulting", "Manpower", "Marketing Services", "Impact & Other Platforms", "Pass Thru"] as const;
