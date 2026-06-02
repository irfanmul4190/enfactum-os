import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Employee } from "@/hooks/useSupabaseAuth";

export type UserRole = "admin" | "finance" | "project_lead" | "partner" | "leadership";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  stakeholder_id?: string;
  avatar?: string;
}

// Map the per-app matrix access level (read/write/admin) to the legacy
// fine-grained UserRole that this app's permission system uses. The mapping
// is intentionally coarse — if you need finer separation per person, raise
// or lower their matrix level for profit-navigator.
function mapAccessLevelToUserRole(level: "read" | "write" | "admin" | "none" | undefined): UserRole {
  switch (level) {
    case "admin": return "admin";
    case "write": return "project_lead";
    case "read":  return "leadership";  // view-everything, edit-nothing
    default:      return "partner";     // most-restrictive fallback
  }
}

// FALLBACK_USERS removed — earlier versions defaulted unauthenticated visitors
// to admin, which was a security hole. AuthProvider now requires a real
// employee (gated by SupabaseAuthProvider + ProtectedShell in App.tsx). If
// employee somehow arrives null, we render a no-permission shell instead of
// faking an admin.
const NO_ACCESS_USER: MockUser = {
  id: "no-access",
  name: "Unknown",
  email: "",
  role: "partner", // most-restrictive role in ROLE_PERMISSIONS
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  finance: "Finance",
  project_lead: "Project Lead",
  partner: "Partner",
  leadership: "Leadership",
};

export const ROLE_COLORS: Record<UserRole, string> = {
  admin: "hsl(210 100% 58%)",
  finance: "hsl(155 60% 45%)",
  project_lead: "hsl(38 95% 56%)",
  partner: "hsl(280 60% 60%)",
  leadership: "hsl(0 0% 65%)",
};

// Permission definitions
export type Permission =
  | "view_dashboard"
  | "view_projects"
  | "edit_projects"
  | "delete_projects"
  | "view_clients"
  | "edit_clients"
  | "view_invoices"
  | "edit_invoices"
  | "view_settlements"
  | "approve_settlements"
  | "view_validation"
  | "view_settings"
  | "edit_settings"
  | "view_timesheets"
  | "edit_timesheets"
  | "view_vendor_costs"
  | "edit_vendor_costs"
  | "view_analytics";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    "view_dashboard", "view_projects", "edit_projects", "delete_projects",
    "view_clients", "edit_clients", "view_invoices", "edit_invoices",
    "view_settlements", "approve_settlements", "view_validation",
    "view_settings", "edit_settings", "view_timesheets", "edit_timesheets",
    "view_vendor_costs", "edit_vendor_costs", "view_analytics",
  ],
  finance: [
    "view_dashboard", "view_projects", "view_clients",
    "view_invoices", "edit_invoices", "view_settlements", "approve_settlements",
    "view_validation", "view_timesheets", "view_vendor_costs", "view_analytics",
  ],
  project_lead: [
    "view_dashboard", "view_projects", "edit_projects",
    "view_clients", "view_invoices", "view_settlements",
    "view_timesheets", "edit_timesheets", "view_vendor_costs", "edit_vendor_costs",
    "view_analytics",
  ],
  partner: [
    "view_dashboard", "view_settlements", "view_analytics",
  ],
  leadership: [
    "view_dashboard", "view_projects", "view_clients",
    "view_invoices", "view_settlements", "view_validation", "view_analytics",
  ],
};

// Which nav routes each role can see
export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  "/": "view_dashboard",
  "/projects": "view_projects",
  "/clients": "view_clients",
  "/finance": "view_invoices",
  "/analytics": "view_analytics",
  "/validation": "view_validation",
  "/settings": "view_settings",
};

interface AuthContextType {
  user: MockUser;
  setUser: (user: MockUser) => void;
  switchRole: (role: UserRole) => void;
  hasPermission: (perm: Permission) => boolean;
  allUsers: MockUser[];
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({
  children,
  employee,
  accessLevel,
}: {
  children: ReactNode;
  employee?: Employee | null;
  accessLevel?: "read" | "write" | "admin" | "none";
}) {
  // Build user from employee if available. Role now derives from the matrix
  // access level instead of the freeform employees.role string.
  const employeeUser: MockUser | null = employee ? {
    id: employee.id,
    name: employee.name,
    email: employee.email,
    role: mapAccessLevelToUserRole(accessLevel),
  } : null;

  const [user, setUser] = useState<MockUser>(employeeUser || NO_ACCESS_USER);

  // Update user when employee changes
  if (employeeUser && user.id !== employeeUser.id) {
    setUser(employeeUser);
  }

  const allUsers = employeeUser ? [employeeUser] : [NO_ACCESS_USER];

  const switchRole = useCallback((role: UserRole) => {
    setUser(prev => ({ ...prev, role }));
  }, []);

  const hasPermission = useCallback((perm: Permission) => {
    return ROLE_PERMISSIONS[user.role]?.includes(perm) ?? false;
  }, [user.role]);

  return (
    <AuthContext.Provider value={{ user, setUser, switchRole, hasPermission, allUsers }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
