import { useState, useCallback, useMemo, createContext, useContext, useEffect } from "react";
import type { Client, Project, Timesheet, VendorCost, OtherCost, Invoice, ProjectStakeholderSplit, Stakeholder, InternalResource, Vendor } from "@/data/types";
import type { ProjectDocument } from "@/components/ProjectDocuments";
import { useVDeals, useAccounts, useMargins, useEmployees, useProjectDetails, type DbVDeal, type DbAccount, type DbMargin, type DbProjectDetails } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";

// Globally-unique client-generated ids. The pn_* tables use text primary keys
// supplied by the app, so ids must not collide across sessions or users.
function nextId(prefix: string) {
  const uuid = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${uuid}`;
}

// ─── Mappers: Supabase rows ↔ app domain types ──────────────────────────────

function parsePaymentTermsDays(text: string | undefined | null): number {
  const n = Number.parseInt(String(text ?? "").replace(/\D/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : 30;
}

// Map a Supabase accounts row → Client.
function mapAccountToClient(acc: DbAccount): Client {
  return {
    client_id: acc.id,
    client_name: acc.name,
    client_legal_name: acc.legal_name ?? undefined,
    country: acc.country ?? "",
    industry: acc.industry ?? "",
    billing_currency: acc.billing_currency ?? "SGD",
    payment_terms: acc.default_payment_terms_days != null
      ? `Net ${acc.default_payment_terms_days}`
      : "Net 30",
    tax_treatment: (acc.tax_treatment as Client["tax_treatment"]) ?? "Tax Exclusive",
    billing_contact_name: acc.primary_contact_name ?? undefined,
    billing_contact_email: acc.primary_contact_email ?? undefined,
    notes: acc.notes ?? undefined,
  };
}

// Client (partial) → accounts column patch. Only defined keys are written.
function clientToAccountRow(c: Partial<Client>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (c.client_name !== undefined) row.name = c.client_name;
  if (c.client_legal_name !== undefined) row.legal_name = c.client_legal_name ?? null;
  if (c.country !== undefined) row.country = c.country;
  if (c.industry !== undefined) row.industry = c.industry;
  if (c.billing_currency !== undefined) row.billing_currency = c.billing_currency;
  if (c.payment_terms !== undefined) row.default_payment_terms_days = parsePaymentTermsDays(c.payment_terms);
  if (c.tax_treatment !== undefined) row.tax_treatment = c.tax_treatment;
  if (c.billing_contact_name !== undefined) row.primary_contact_name = c.billing_contact_name ?? null;
  if (c.billing_contact_email !== undefined) row.primary_contact_email = c.billing_contact_email ?? null;
  if (c.notes !== undefined) row.notes = c.notes ?? null;
  return row;
}

// Map a Supabase v_deals row (+ margin + project_details) → Project. A deal
// with a project_details row is a Profit Navigator-managed project; one
// without is a pipeline-pro deal surfaced read-style, so the PN-specific
// fields fall back to sensible defaults.
function mapVDealToProject(vd: DbVDeal, margin?: DbMargin, details?: DbProjectDetails): Project {
  const isPnManaged = !!details;
  return {
    project_id: vd.id,
    client_id: vd.account_id,
    project_name: vd.title,
    project_code: `DEAL-${vd.id.substring(0, 6).toUpperCase()}`,
    description: vd.description ?? undefined,
    country_of_delivery: details?.country_of_delivery ?? "",
    currency: vd.currency ?? "SGD",
    start_date: details?.start_date ?? new Date().toISOString().split("T")[0],
    end_date: details?.end_date ?? new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
    status: isPnManaged
      ? (vd.stage ?? "Draft")
      : (vd.stage === "Closed Won" ? "Active" : vd.stage === "Closed Lost" ? "Closed" : "Draft"),
    business_type: (details?.business_type as Project["business_type"]) ?? "Consulting",
    commercial_model: (details?.commercial_model as Project["commercial_model"]) ?? "ENFACTUM_LED",
    invoice_model: details?.invoice_model ?? "Fixed Fee",
    revenue_recognition_basis: details?.revenue_recognition_basis ?? "Invoices (Actual)",
    contracted_revenue_ex_tax: margin?.revenue ?? vd.value ?? 0,
    margin_target_percent: details?.margin_target_percent ?? 40,
    approvals_status: details?.approvals_status ?? (margin?.approved ? "Approved" : "Pending"),
    sales_person: details?.sales_person ?? vd.owner_name ?? undefined,
    external_partner_stakeholder_id: details?.external_partner_stakeholder_id ?? undefined,
    partner_revenue_basis_ex_tax: details?.partner_revenue_basis_ex_tax ?? undefined,
    flat_fee_percent: details?.flat_fee_percent ?? undefined,
    pass_through_payout_basis: (details?.pass_through_payout_basis as Project["pass_through_payout_basis"]) ?? undefined,
    internal_recharge_applies: details?.internal_recharge_applies ?? undefined,
  };
}

// Project (partial) → deals column patch (core fields shared with pipeline-pro).
function projectToDealRow(p: Partial<Project>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (p.project_name !== undefined) row.title = p.project_name;
  if (p.client_id !== undefined) row.account_id = p.client_id || null;
  if (p.description !== undefined) row.description = p.description ?? null;
  if (p.currency !== undefined) row.currency = p.currency;
  if (p.contracted_revenue_ex_tax !== undefined) row.value = p.contracted_revenue_ex_tax;
  if (p.status !== undefined) row.stage = p.status;
  return row;
}

// Project (partial) → project_details column patch (PN-specific fields).
function projectToDetailsRow(p: Partial<Project>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (p.country_of_delivery !== undefined) row.country_of_delivery = p.country_of_delivery || null;
  if (p.start_date !== undefined) row.start_date = p.start_date || null;
  if (p.end_date !== undefined) row.end_date = p.end_date || null;
  if (p.business_type !== undefined) row.business_type = p.business_type;
  if (p.commercial_model !== undefined) row.commercial_model = p.commercial_model;
  if (p.invoice_model !== undefined) row.invoice_model = p.invoice_model;
  if (p.revenue_recognition_basis !== undefined) row.revenue_recognition_basis = p.revenue_recognition_basis;
  if (p.margin_target_percent !== undefined) row.margin_target_percent = p.margin_target_percent;
  if (p.approvals_status !== undefined) row.approvals_status = p.approvals_status ?? null;
  if (p.sales_person !== undefined) row.sales_person = p.sales_person ?? null;
  if (p.external_partner_stakeholder_id !== undefined) row.external_partner_stakeholder_id = p.external_partner_stakeholder_id ?? null;
  if (p.partner_revenue_basis_ex_tax !== undefined) row.partner_revenue_basis_ex_tax = p.partner_revenue_basis_ex_tax ?? null;
  if (p.flat_fee_percent !== undefined) row.flat_fee_percent = p.flat_fee_percent ?? null;
  if (p.pass_through_payout_basis !== undefined) row.pass_through_payout_basis = p.pass_through_payout_basis ?? null;
  if (p.internal_recharge_applies !== undefined) row.internal_recharge_applies = p.internal_recharge_applies ?? null;
  return row;
}

// ─── Profit Navigator entity persistence (pn_* tables) ──────────────────────
// Every pn_* table column matches its app-type field name 1:1, except the
// table's `id` which maps to the app's `<entity>_id`. These helpers bridge
// that single difference; `payout_amount_computed` is derived, never stored.

const PN_COMPUTED_FIELDS = ["payout_amount_computed"];

function entityToRow(entity: Record<string, unknown>, idField: string): Record<string, unknown> {
  const row: Record<string, unknown> = { id: entity[idField] };
  for (const [k, v] of Object.entries(entity)) {
    if (k !== idField && !PN_COMPUTED_FIELDS.includes(k)) row[k] = v;
  }
  return row;
}

function patchToRow(patch: Record<string, unknown>, id: string, idField: string): Record<string, unknown> {
  const row: Record<string, unknown> = { id };
  for (const [k, v] of Object.entries(patch)) {
    if (k !== idField && !PN_COMPUTED_FIELDS.includes(k)) row[k] = v;
  }
  return row;
}

function rowToEntity<T>(row: Record<string, unknown>, idField: string): T {
  const out: Record<string, unknown> = { [idField]: row.id };
  for (const [k, v] of Object.entries(row)) {
    if (k !== "id" && k !== "created_at" && k !== "updated_at") out[k] = v;
  }
  return out as T;
}

// Fire-and-forget persistence — the UI updates optimistically from local
// state; these write through to Supabase in the background.
function pnInsert(table: string, row: Record<string, unknown>) {
  void supabase.from(table).insert(row).then(({ error }) => {
    if (error && import.meta.env.DEV) console.error(`pn persistinsert ${table} failed:`, error.message);
  });
}
function pnInsertMany(table: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  void supabase.from(table).insert(rows).then(({ error }) => {
    if (error && import.meta.env.DEV) console.error(`pn persistinsert ${table} failed:`, error.message);
  });
}
function pnUpdate(table: string, row: Record<string, unknown>) {
  void supabase.from(table).update(row).eq("id", row.id as string).then(({ error }) => {
    if (error && import.meta.env.DEV) console.error(`pn persistupdate ${table} failed:`, error.message);
  });
}
function pnDelete(table: string, id: string) {
  void supabase.from(table).delete().eq("id", id).then(({ error }) => {
    if (error && import.meta.env.DEV) console.error(`pn persistdelete ${table} failed:`, error.message);
  });
}

export function useDataStoreProvider() {
  // Supabase data sources
  const { data: vDeals, loading: dealsLoading, refetch: refetchDeals } = useVDeals();
  const { data: accounts, loading: accountsLoading, refetch: refetchAccounts } = useAccounts();
  const { data: margins, loading: marginsLoading, refetch: refetchMargins, insertMargin, updateMargin, deleteMargin } = useMargins();
  const { data: employees, loading: employeesLoading } = useEmployees();
  const { data: projectDetails, loading: detailsLoading, refetch: refetchDetails } = useProjectDetails();

  // Map Supabase data to app types
  const clients = useMemo<Client[]>(() => accounts.map(mapAccountToClient), [accounts]);

  const projects = useMemo<Project[]>(() => {
    return vDeals.map(vd => {
      const margin = margins.find(m => m.deal_id === vd.id);
      const details = projectDetails.find(d => d.deal_id === vd.id);
      return mapVDealToProject(vd, margin, details);
    });
  }, [vDeals, margins, projectDetails]);

  // Local state for data not in Supabase
  const [timesheetsList, setTimesheets] = useState<Timesheet[]>([]);
  const [vendorCostsList, setVendorCosts] = useState<VendorCost[]>([]);
  const [otherCostsList, setOtherCosts] = useState<OtherCost[]>([]);
  const [invoicesList, setInvoices] = useState<Invoice[]>([]);
  const [splitsList, setSplits] = useState<ProjectStakeholderSplit[]>([]);
  const [stakeholdersList, setStakeholders] = useState<Stakeholder[]>([]);
  const [resourcesList, setResources] = useState<InternalResource[]>([]);
  const [vendorsList, setVendorsList] = useState<Vendor[]>([]);
  const [documentsList, setDocuments] = useState<ProjectDocument[]>([]);

  // Map employees to resources
  useEffect(() => {
    if (employees.length > 0) {
      setResources(employees.map(emp => ({
        resource_id: emp.id,
        resource_name: emp.name,
        role: emp.role || "Consultant",
        cost_rate_per_hour: 0,
        recharge_rate_per_hour: 0,
        active_flag: true,
      })));
    }
  }, [employees]);

  // Load persisted Profit Navigator entities from the pn_* tables. Falls back
  // gracefully (lists stay empty) if the tables aren't present yet.
  const loadEntities = useCallback(async () => {
    const [ts, vc, oc, inv, sp, sk, vn] = await Promise.all([
      supabase.from("pn_timesheets").select("*"),
      supabase.from("pn_vendor_costs").select("*"),
      supabase.from("pn_other_costs").select("*"),
      supabase.from("pn_invoices").select("*"),
      supabase.from("pn_project_splits").select("*"),
      supabase.from("pn_stakeholders").select("*"),
      supabase.from("pn_vendors").select("*"),
    ]);
    if (ts.data) setTimesheets(ts.data.map(r => rowToEntity<Timesheet>(r, "timesheet_id")));
    if (vc.data) setVendorCosts(vc.data.map(r => rowToEntity<VendorCost>(r, "vendor_cost_id")));
    if (oc.data) setOtherCosts(oc.data.map(r => rowToEntity<OtherCost>(r, "other_cost_id")));
    if (inv.data) setInvoices(inv.data.map(r => rowToEntity<Invoice>(r, "invoice_id")));
    if (sp.data) setSplits(sp.data.map(r => rowToEntity<ProjectStakeholderSplit>(r, "split_id")));
    if (sk.data) setStakeholders(sk.data.map(r => rowToEntity<Stakeholder>(r, "stakeholder_id")));
    if (vn.data) setVendorsList(vn.data.map(r => rowToEntity<Vendor>(r, "vendor_id")));
  }, []);

  useEffect(() => {
    void loadEntities();
  }, [loadEntities]);

  // Loading state
  const isLoading = dealsLoading || accountsLoading || marginsLoading || employeesLoading || detailsLoading;

  // Client CRUD → public.accounts (shared table; see migration 20260522120000)
  const addClient = useCallback(async (c: Omit<Client, "client_id">): Promise<Client> => {
    const { data, error } = await supabase
      .from("accounts")
      .insert(clientToAccountRow(c))
      .select("*")
      .single();
    if (error) throw error;
    await refetchAccounts();
    return mapAccountToClient(data as DbAccount);
  }, [refetchAccounts]);

  const updateClient = useCallback(async (id: string, c: Partial<Client>) => {
    const { error } = await supabase
      .from("accounts")
      .update(clientToAccountRow(c))
      .eq("id", id);
    if (error) throw error;
    await refetchAccounts();
  }, [refetchAccounts]);

  const deleteClient = useCallback(async (id: string) => {
    const { error } = await supabase.from("accounts").delete().eq("id", id);
    if (error) throw error;
    await refetchAccounts();
  }, [refetchAccounts]);

  // Project CRUD → public.deals + public.project_details
  const addProject = useCallback(async (p: Omit<Project, "project_id" | "project_code">): Promise<Project> => {
    const { data: deal, error } = await supabase
      .from("deals")
      .insert(projectToDealRow(p))
      .select("id")
      .single();
    if (error) throw error;
    const dealId = (deal as { id: string }).id;
    const { error: detErr } = await supabase
      .from("project_details")
      .insert({ deal_id: dealId, ...projectToDetailsRow(p) });
    if (detErr) throw detErr;
    await Promise.all([refetchDeals(), refetchDetails()]);
    return {
      ...(p as Project),
      project_id: dealId,
      project_code: `DEAL-${dealId.substring(0, 6).toUpperCase()}`,
    };
  }, [refetchDeals, refetchDetails]);

  const updateProject = useCallback(async (id: string, p: Partial<Project>) => {
    const dealRow = projectToDealRow(p);
    if (Object.keys(dealRow).length > 0) {
      const { error } = await supabase.from("deals").update(dealRow).eq("id", id);
      if (error) throw error;
    }
    const detRow = projectToDetailsRow(p);
    if (Object.keys(detRow).length > 0) {
      const { error } = await supabase
        .from("project_details")
        .upsert({ deal_id: id, ...detRow }, { onConflict: "deal_id" });
      if (error) throw error;
    }
    await Promise.all([refetchDeals(), refetchDetails()]);
  }, [refetchDeals, refetchDetails]);

  const deleteProject = useCallback(async (id: string) => {
    // project_details and margins cascade-delete via their FK to deals.
    const { error } = await supabase.from("deals").delete().eq("id", id);
    if (error) throw error;
    await Promise.all([refetchDeals(), refetchDetails(), refetchMargins()]);
  }, [refetchDeals, refetchDetails, refetchMargins]);

  // Timesheets → pn_timesheets
  const addTimesheet = useCallback((t: Omit<Timesheet, "timesheet_id">) => {
    const newTs = { ...t, timesheet_id: nextId("ts") };
    setTimesheets(prev => [...prev, newTs]);
    pnInsert("pn_timesheets", entityToRow(newTs, "timesheet_id"));
    return newTs;
  }, []);
  const updateTimesheet = useCallback((id: string, t: Partial<Timesheet>) => {
    setTimesheets(prev => prev.map(ts => ts.timesheet_id === id ? { ...ts, ...t } : ts));
    pnUpdate("pn_timesheets", patchToRow(t, id, "timesheet_id"));
  }, []);
  const deleteTimesheet = useCallback((id: string) => {
    setTimesheets(prev => prev.filter(ts => ts.timesheet_id !== id));
    pnDelete("pn_timesheets", id);
  }, []);

  // Vendor Costs → pn_vendor_costs
  const addVendorCost = useCallback((v: Omit<VendorCost, "vendor_cost_id">) => {
    const newVc = { ...v, vendor_cost_id: nextId("vc") };
    setVendorCosts(prev => [...prev, newVc]);
    pnInsert("pn_vendor_costs", entityToRow(newVc, "vendor_cost_id"));
    return newVc;
  }, []);
  const updateVendorCost = useCallback((id: string, v: Partial<VendorCost>) => {
    setVendorCosts(prev => prev.map(vc => vc.vendor_cost_id === id ? { ...vc, ...v } : vc));
    pnUpdate("pn_vendor_costs", patchToRow(v, id, "vendor_cost_id"));
  }, []);
  const deleteVendorCost = useCallback((id: string) => {
    setVendorCosts(prev => prev.filter(vc => vc.vendor_cost_id !== id));
    pnDelete("pn_vendor_costs", id);
  }, []);

  // Splits → pn_project_splits
  const addSplit = useCallback((s: Omit<ProjectStakeholderSplit, "split_id">) => {
    const newSplit = { ...s, split_id: nextId("sp") };
    setSplits(prev => [...prev, newSplit]);
    pnInsert("pn_project_splits", entityToRow(newSplit, "split_id"));
    return newSplit;
  }, []);
  const addSplits = useCallback((arr: Omit<ProjectStakeholderSplit, "split_id">[]) => {
    const newSplits = arr.map(s => ({ ...s, split_id: nextId("sp") }));
    setSplits(prev => [...prev, ...newSplits]);
    pnInsertMany("pn_project_splits", newSplits.map(s => entityToRow(s, "split_id")));
    return newSplits;
  }, []);

  // Stakeholders → pn_stakeholders
  const addStakeholder = useCallback((s: Omit<Stakeholder, "stakeholder_id">) => {
    const n = { ...s, stakeholder_id: nextId("s") };
    setStakeholders(prev => [...prev, n]);
    pnInsert("pn_stakeholders", entityToRow(n, "stakeholder_id"));
    return n;
  }, []);
  const updateStakeholder = useCallback((id: string, s: Partial<Stakeholder>) => {
    setStakeholders(prev => prev.map(x => x.stakeholder_id === id ? { ...x, ...s } : x));
    pnUpdate("pn_stakeholders", patchToRow(s, id, "stakeholder_id"));
  }, []);
  const deleteStakeholder = useCallback((id: string) => {
    setStakeholders(prev => prev.filter(x => x.stakeholder_id !== id));
    pnDelete("pn_stakeholders", id);
  }, []);

  // Resources (from employees, local additions)
  const addResource = useCallback((r: Omit<InternalResource, "resource_id">) => {
    const n = { ...r, resource_id: nextId("r") };
    setResources(prev => [...prev, n]);
    return n;
  }, []);
  const updateResource = useCallback((id: string, r: Partial<InternalResource>) => {
    setResources(prev => prev.map(x => x.resource_id === id ? { ...x, ...r } : x));
  }, []);
  const deleteResource = useCallback((id: string) => {
    setResources(prev => prev.filter(x => x.resource_id !== id));
  }, []);

  // Vendors → pn_vendors
  const addVendor = useCallback((v: Omit<Vendor, "vendor_id">) => {
    const n = { ...v, vendor_id: nextId("v") };
    setVendorsList(prev => [...prev, n]);
    pnInsert("pn_vendors", entityToRow(n, "vendor_id"));
    return n;
  }, []);
  const updateVendor = useCallback((id: string, v: Partial<Vendor>) => {
    setVendorsList(prev => prev.map(x => x.vendor_id === id ? { ...x, ...v } : x));
    pnUpdate("pn_vendors", patchToRow(v, id, "vendor_id"));
  }, []);
  const deleteVendor = useCallback((id: string) => {
    setVendorsList(prev => prev.filter(x => x.vendor_id !== id));
    pnDelete("pn_vendors", id);
  }, []);

  // Documents (local)
  const addDocument = useCallback((doc: ProjectDocument) => {
    setDocuments(prev => [...prev, doc]);
  }, []);
  const deleteDocument = useCallback((id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  }, []);

  // Margins (Supabase CRUD)
  const marginsForStore = useMemo(() => margins, [margins]);

  // Reset (refetch everything from Supabase)
  const resetToSeed = useCallback(() => {
    refetchDeals();
    refetchAccounts();
    refetchMargins();
    refetchDetails();
    void loadEntities();
    setDocuments([]);
  }, [refetchDeals, refetchAccounts, refetchMargins, refetchDetails, loadEntities]);

  return {
    clients, addClient, updateClient, deleteClient,
    projects, addProject, updateProject, deleteProject,
    timesheets: timesheetsList, addTimesheet, updateTimesheet, deleteTimesheet,
    vendorCosts: vendorCostsList, addVendorCost, updateVendorCost, deleteVendorCost,
    otherCosts: otherCostsList,
    invoices: invoicesList,
    splits: splitsList, addSplit, addSplits,
    stakeholders: stakeholdersList, addStakeholder, updateStakeholder, deleteStakeholder,
    resources: resourcesList, addResource, updateResource, deleteResource,
    vendors: vendorsList, addVendor, updateVendor, deleteVendor,
    documents: documentsList, addDocument, deleteDocument,
    resetToSeed,
    // Supabase-specific
    isLoading,
    margins: marginsForStore,
    insertMargin,
    updateMargin: updateMargin,
    deleteMargin,
    refetchMargins,
    vDeals,
    employees,
  };
}

export type DataStore = ReturnType<typeof useDataStoreProvider>;

const DataStoreContext = createContext<DataStore | null>(null);

export const DataStoreProvider = DataStoreContext.Provider;

export function useDataStore(): DataStore {
  const ctx = useContext(DataStoreContext);
  if (!ctx) throw new Error("useDataStore must be used within DataStoreProvider");
  return ctx;
}
