import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/supabase";

export const EMPLOYEES_KEY = ["employees"] as const;
export const EMPLOYEE_KEY = (id?: string) => ["employees", id] as const;
export const EMPLOYEE_SENSITIVE_KEY = (id?: string) =>
  ["employees", id, "sensitive"] as const;
export const MANAGER_KEY = (id?: string | null) =>
  ["employees", "manager", id] as const;

export interface EmployeeRow {
  id: string;
  name: string;
  email: string;
  role: string | null;
  status: string;
  department: string | null;
  designation: string | null;
  country?: string | null;
  location?: string | null;
  employment_type?: string | null;
  lifecycle_status?: string | null;
  employee_code?: string | null;
  cost_center?: string | null;
  manager_id?: string | null;
  date_of_joining: string | null;
  date_of_exit?: string | null;
  is_manager?: boolean | null;
  is_finance?: boolean | null;
  is_hr_admin?: boolean | null;
  skills: string[] | null;
  certifications?: unknown;
}

export interface SensitiveRow {
  employee_id: string;
  monthly_ctc: number | null;
  personal_email: string | null;
  phone: string | null;
  payboy_employee_id: string | null;
  insurance_member_id: string | null;
  employee_drive_folder_url: string | null;
  payslips_folder_url: string | null;
  insurance_folder_url: string | null;
  onboarding_folder_url: string | null;
  exit_folder_url: string | null;
}

const FULL_COLUMNS =
  "id, name, email, role, status, department, designation, country, location, " +
  "employment_type, lifecycle_status, employee_code, cost_center, manager_id, " +
  "date_of_joining, date_of_exit, is_manager, is_finance, is_hr_admin, skills, certifications";

export function useEmployees<T = EmployeeRow>(opts?: {
  columns?: string;
  excludeExited?: boolean;
  select?: (rows: any[]) => T[];
}) {
  return useQuery({
    queryKey: [...EMPLOYEES_KEY, opts?.columns ?? "full", opts?.excludeExited ?? false],
    queryFn: async () => {
      let q = db.from("employees").select(opts?.columns ?? FULL_COLUMNS).order("name");
      if (opts?.excludeExited) q = q.neq("status", "exited");
      const { data, error } = await q;
      if (error) throw error;
      return opts?.select ? opts.select(data ?? []) : ((data as unknown as T[]) ?? []);
    },
  });
}

export function useEmployee(id: string | undefined) {
  return useQuery({
    queryKey: EMPLOYEE_KEY(id),
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await db
        .from("employees")
        .select(FULL_COLUMNS)
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as unknown as EmployeeRow;
    },
  });
}

export function useEmployeeSensitive(id: string | undefined) {
  return useQuery({
    queryKey: EMPLOYEE_SENSITIVE_KEY(id),
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await db.rpc("get_employee_sensitive", { p_id: id });
      if (error) throw error;
      return Array.isArray(data) && data.length > 0 ? (data[0] as SensitiveRow) : null;
    },
  });
}

export function useManagerName(managerId: string | null | undefined) {
  return useQuery({
    queryKey: MANAGER_KEY(managerId),
    enabled: !!managerId,
    queryFn: async () => {
      const { data, error } = await db
        .from("employees")
        .select("name")
        .eq("id", managerId)
        .maybeSingle();
      if (error) throw error;
      return (data as { name: string } | null)?.name ?? null;
    },
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("employees").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: EMPLOYEES_KEY }),
  });
}
