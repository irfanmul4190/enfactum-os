import React, { createContext, useContext, useEffect, useState } from 'react';
import { db, type DbEmployee } from '@/integrations/supabase/db';
import { useAuth, type AccessLevel } from './AuthContext';

type AppRole = 'admin' | 'sales_bd' | 'delivery' | 'readonly';

// Derive the app role from the per-app access matrix level — the single
// source of truth that ProtectedRoute (canAdmin) and the launcher's
// /admin/people matrix also use. Previously this read the freeform
// employees.role string, which no UI manages, so the sidebar and admin
// pages could disagree with the route guard (e.g. a user could see the
// Settings link but get bounced on click, or vice versa).
const ACCESS_TO_ROLE: Record<AccessLevel, AppRole> = {
  admin: 'admin',
  write: 'sales_bd',
  read: 'readonly',
  none: 'readonly',
};

const ROLE_PERMISSIONS: Record<AppRole, Set<string>> = {
  admin: new Set(['create', 'edit', 'delete', 'view', 'add_notes']),
  sales_bd: new Set(['create', 'edit', 'view', 'add_notes']),
  delivery: new Set(['view', 'add_notes']),
  readonly: new Set(['view']),
};

interface EmployeeContextType {
  employee: DbEmployee | null;
  loading: boolean;
  error: string | null;
  appRole: AppRole;
  hasPermission: (action: 'create' | 'edit' | 'delete' | 'view' | 'add_notes') => boolean;
}

const EmployeeContext = createContext<EmployeeContextType | null>(null);

export function EmployeeProvider({ children }: { children: React.ReactNode }) {
  const { user, accessLevel } = useAuth();
  const [employee, setEmployee] = useState<DbEmployee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.email) {
      setEmployee(null);
      setLoading(false);
      return;
    }

    const fetchEmployee = async () => {
      setLoading(true);
      setError(null);
      const { data, error: err } = await db
        .from('employees')
        .select('*')
        .eq('email', user.email!)
        .maybeSingle();

      if (err) {
        if (import.meta.env.DEV) console.error('Failed to fetch employee:', err);
        setError('Could not find your employee record.');
      }
      setEmployee(data as DbEmployee | null);
      setLoading(false);
    };

    fetchEmployee();
  }, [user?.email]);

  const appRole: AppRole = ACCESS_TO_ROLE[accessLevel] ?? 'readonly';

  const hasPermission = (action: string) =>
    ROLE_PERMISSIONS[appRole]?.has(action) ?? false;

  return (
    <EmployeeContext.Provider value={{ employee, loading, error, appRole, hasPermission }}>
      {children}
    </EmployeeContext.Provider>
  );
}

export function useEmployee() {
  const ctx = useContext(EmployeeContext);
  if (!ctx) throw new Error('useEmployee must be used within EmployeeProvider');
  return ctx;
}
