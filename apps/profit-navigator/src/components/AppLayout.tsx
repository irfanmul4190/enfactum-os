import { Link, useLocation, Outlet } from "react-router-dom";
import { Briefcase, LayoutDashboard, Users, CheckCircle, Settings, Sun, Moon, Lock, BarChart3, Receipt, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { EnfactumLogo } from "@repo/ui/enfactum-logo";
import { APP_VERSION } from "@/lib/version";
import { useAuth, ROUTE_PERMISSIONS } from "@/hooks/useAuth";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import RoleSwitcher from "@/components/RoleSwitcher";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  { to: "/projects", label: "Projects", icon: Briefcase },
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/clients", label: "On-board Clients", icon: Users },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/finance", label: "Finance Quick Access", icon: Receipt, requiredRole: "finance" as const },
  { to: "/validation", label: "Validation", icon: CheckCircle },
  { to: "/settings", label: "Operational Settings", icon: Settings },
  
];

export default function AppLayout() {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { hasPermission, user } = useAuth();
  const { signOut, employee } = useSupabaseAuth();

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className="w-56 flex-shrink-0 flex flex-col border-r"
        style={{
          background: "var(--gradient-sidebar)",
          borderColor: "var(--glass-border)",
          backdropFilter: "var(--glass-blur)",
        }}
      >
        <div className="px-5 py-5 border-b flex items-center justify-between" style={{ borderColor: "var(--glass-border)" }}>
          <EnfactumLogo size={28} />
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 hover:scale-110"
            style={{
              background: "var(--glass-btn-bg)",
              border: "1px solid var(--glass-btn-border)",
              color: "hsl(var(--muted-foreground))",
            }}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, ...rest }) => {
            const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
            const requiredPerm = ROUTE_PERMISSIONS[to];
            const allowed = requiredPerm ? hasPermission(requiredPerm) : true;

            // Finance Quick Access: only visible to finance and admin
            if ('requiredRole' in rest && rest.requiredRole === "finance") {
              if (user.role !== "finance" && user.role !== "admin") return null;
            }

            if (!allowed) {
              return (
                <Tooltip key={to}>
                  <TooltipTrigger asChild>
                    <span className="nav-item w-full opacity-35 cursor-not-allowed flex items-center">
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {label}
                      <Lock className="h-3 w-3 ml-auto" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="right">No access with current role</TooltipContent>
                </Tooltip>
              );
            }

            return (
              <Link
                key={to}
                to={to}
                className={cn("nav-item w-full", active && "active")}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-3 border-t space-y-2" style={{ borderColor: "var(--glass-border)" }}>
          {employee && (
            <div className="text-xs px-3 py-1 truncate" style={{ color: "hsl(var(--muted-foreground))" }}>
              {employee.name} · {employee.role}
            </div>
          )}
          {/* RoleSwitcher is a dev-only debug tool. In production it would let
              any signed-in user self-escalate to admin via the UI. Stripped
              by Vite's dead-code elimination when import.meta.env.DEV === false. */}
          {import.meta.env.DEV && <RoleSwitcher />}
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors hover:bg-white/5"
            style={{ color: "hsl(var(--muted-foreground))", border: "1px solid var(--glass-border)" }}
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
          <p className="text-[10px] text-center" style={{ color: "hsl(var(--muted-foreground))" }}>Margin Manager · {APP_VERSION}</p>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-background">
        <Outlet />
      </main>
    </div>
  );
}
