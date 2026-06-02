import { getSupabaseClient } from "./auth";
import { ACCESS_MATRIX_APPS, type AccessMatrixAppId } from "@enfactum/auth-gate";

export type AccessLevel = "none" | "read" | "write" | "admin";

// Re-export under the launcher's local names. The canonical list lives in
// @enfactum/auth-gate so the matrix UI here and HR Hub's new-employee seeder
// can't drift.
export const APPS = ACCESS_MATRIX_APPS;
export type AppId = AccessMatrixAppId;

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string | null;
  status: string | null;
  department: string | null;
  is_matrix_admin: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface EmployeeWithAccess extends Employee {
  // Map of app id → access level. Apps without a row default to "none".
  access: Record<AppId, AccessLevel>;
}

export interface EmployeeInput {
  name: string;
  email: string;
  role?: string;
  is_matrix_admin?: boolean;
  status?: "active" | "suspended";
  department?: string | null;
}

export function isMatrixAdmin(emp: Employee | null | undefined): boolean {
  if (!emp) return false;
  if ((emp.status ?? "active") !== "active") return false;
  return emp.is_matrix_admin === true;
}

export async function fetchSelf(email: string): Promise<Employee | null> {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from("employees")
    .select(
      "id, name, email, role, status, department, is_matrix_admin, created_at, updated_at",
    )
    .eq("email", email)
    .maybeSingle();
  if (error) throw error;
  return (data as Employee | null) ?? null;
}

export async function listEmployeesWithAccess(): Promise<EmployeeWithAccess[]> {
  const supabase = await getSupabaseClient();
  const [employeesRes, accessRes] = await Promise.all([
    supabase
      .from("employees")
      .select(
        "id, name, email, role, status, department, is_matrix_admin, created_at, updated_at",
      )
      .order("email", { ascending: true }),
    supabase.from("employee_app_access").select("employee_id, app, access_level"),
  ]);
  if (employeesRes.error) throw employeesRes.error;
  if (accessRes.error) throw accessRes.error;

  const accessByEmployee = new Map<string, Record<AppId, AccessLevel>>();
  for (const row of accessRes.data ?? []) {
    const map =
      accessByEmployee.get(row.employee_id) ?? ({} as Record<AppId, AccessLevel>);
    map[row.app as AppId] = row.access_level as AccessLevel;
    accessByEmployee.set(row.employee_id, map);
  }

  return (employeesRes.data ?? []).map((emp) => {
    const map = accessByEmployee.get(emp.id) ?? ({} as Record<AppId, AccessLevel>);
    const access: Record<AppId, AccessLevel> = {} as Record<AppId, AccessLevel>;
    for (const app of APPS) {
      access[app.id] = map[app.id] ?? "none";
    }
    return { ...(emp as Employee), access };
  });
}

export async function addEmployee(
  input: EmployeeInput,
  initialAccess: Partial<Record<AppId, AccessLevel>> = {},
): Promise<EmployeeWithAccess> {
  const supabase = await getSupabaseClient();
  const { data: emp, error } = await supabase
    .from("employees")
    .insert({
      name: input.name,
      email: input.email.toLowerCase().trim(),
      role: input.role ?? null,
      is_matrix_admin: input.is_matrix_admin ?? false,
      status: input.status ?? "active",
      department: input.department ?? null,
    })
    .select(
      "id, name, email, role, status, department, is_matrix_admin, created_at, updated_at",
    )
    .single();
  if (error) throw error;

  // Seed app_access rows for the requested apps (default 'read' for missing).
  const accessRows = APPS.map((app) => ({
    employee_id: (emp as Employee).id,
    app: app.id,
    access_level: (initialAccess[app.id] ?? "read") as AccessLevel,
  }));
  const { error: accessErr } = await supabase
    .from("employee_app_access")
    .upsert(accessRows, { onConflict: "employee_id,app" });
  if (accessErr) throw accessErr;

  const access: Record<AppId, AccessLevel> = {} as Record<AppId, AccessLevel>;
  for (const row of accessRows) access[row.app as AppId] = row.access_level;
  return { ...(emp as Employee), access };
}

export async function updateEmployee(
  id: string,
  patch: Partial<EmployeeInput>,
): Promise<Employee> {
  const supabase = await getSupabaseClient();
  const update: Record<string, unknown> = {};
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.email !== undefined) update.email = patch.email.toLowerCase().trim();
  if (patch.role !== undefined) update.role = patch.role;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.department !== undefined) update.department = patch.department;
  if (patch.is_matrix_admin !== undefined) update.is_matrix_admin = patch.is_matrix_admin;

  const { data, error } = await supabase
    .from("employees")
    .update(update)
    .eq("id", id)
    .select(
      "id, name, email, role, status, department, is_matrix_admin, created_at, updated_at",
    )
    .single();
  if (error) throw error;
  return data as Employee;
}

export async function setAccess(
  employeeId: string,
  app: AppId,
  level: AccessLevel,
): Promise<void> {
  const supabase = await getSupabaseClient();
  const { error } = await supabase
    .from("employee_app_access")
    .upsert(
      { employee_id: employeeId, app, access_level: level },
      { onConflict: "employee_id,app" },
    );
  if (error) throw error;
}

export async function deleteEmployee(id: string): Promise<void> {
  const supabase = await getSupabaseClient();
  const { error } = await supabase.from("employees").delete().eq("id", id);
  if (error) throw error;
}
