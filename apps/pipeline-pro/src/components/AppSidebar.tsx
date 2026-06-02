import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Kanban,
  Building2,
  FileStack,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  User,
  Upload,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployee } from '@/contexts/EmployeeContext';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pipeline', icon: Kanban, label: 'Pipeline' },
  { to: '/accounts', icon: Building2, label: 'Accounts' },
  { to: '/pitch-library', icon: FileStack, label: 'Pitch Library' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
];

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  sales_bd: 'Sales / BD',
  delivery: 'Delivery',
  readonly: 'Read-only',
};

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, signOut } = useAuth();
  const { employee, appRole } = useEmployee();
  const location = useLocation();

  const displayName = employee?.name || user?.user_metadata?.full_name || user?.email || 'User';
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <aside
      className={cn(
        'h-screen flex flex-col flex-shrink-0 transition-all duration-300 border-r border-sidebar-border',
        collapsed ? 'w-[60px]' : 'w-56'
      )}
      style={{ background: 'hsl(var(--sidebar-background))' }}
    >
      {/* Enfactum Logo */}
      <div
        className="flex items-center justify-between h-14 px-3 border-b"
        style={{ borderColor: 'hsl(var(--sidebar-border))' }}
      >
        {!collapsed && (
          <div className="flex items-baseline gap-0 select-none">
            <span className="text-[15px] font-bold tracking-tight" style={{ color: 'hsl(var(--sidebar-accent-foreground))' }}>
              en
            </span>
            <span className="text-[15px] font-bold tracking-tight text-brand-blue">
              fact
            </span>
            <span className="text-[15px] font-bold tracking-tight" style={{ color: 'hsl(var(--sidebar-accent-foreground))' }}>
              um
            </span>
          </div>
        )}
        {collapsed && (
          <span className="text-[13px] font-bold text-brand-blue mx-auto">ef</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded transition-colors hover:bg-sidebar-accent"
          style={{ color: 'hsl(var(--sidebar-foreground))' }}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Section label */}
      {!collapsed && (
        <div className="px-4 pt-4 pb-1">
          <span className="section-label">Funnel Manager</span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-2 px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn('nav-item', isActive && 'active')}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}

        {appRole === 'admin' && (
          <>
            {!collapsed && (
              <div className="pt-4 pb-1 px-1">
                <span className="section-label">System</span>
              </div>
            )}
            <NavLink
              to="/admin"
              className={cn('nav-item', location.pathname === '/admin' && 'active')}
              title={collapsed ? 'Admin Settings' : undefined}
            >
              <Settings className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>Settings</span>}
            </NavLink>
            <NavLink
              to="/admin/import"
              className={cn('nav-item', location.pathname === '/admin/import' && 'active')}
              title={collapsed ? 'Import Tool' : undefined}
            >
              <Upload className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>Import</span>}
            </NavLink>
          </>
        )}
      </nav>

      {/* User info */}
      <div className="px-2 py-3 border-t" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
        {!collapsed ? (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 px-2">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-6 h-6 rounded-full flex-shrink-0" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <User className="h-3 w-3 text-brand-blue" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate" style={{ color: 'hsl(var(--sidebar-accent-foreground))' }}>
                  {displayName}
                </p>
                <p className="text-[10px]" style={{ color: 'hsl(var(--sidebar-foreground))' }}>
                  {ROLE_LABELS[appRole] || appRole}
                </p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-[11px] rounded transition-colors hover:bg-sidebar-accent"
              style={{ color: 'hsl(var(--sidebar-foreground))' }}
            >
              <LogOut className="h-3 w-3" />
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex justify-center" title={`${displayName} (${ROLE_LABELS[appRole] || appRole})`}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-7 h-7 rounded-full" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-brand-blue" />
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
