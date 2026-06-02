import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard, Users, Grid3X3, BarChart3, Award, Settings, LogOut,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/people', icon: Users, label: 'People' },
  { to: '/skills', icon: Grid3X3, label: 'Skills Matrix' },
  { to: '/utilization', icon: BarChart3, label: 'Utilization' },
  { to: '/certifications', icon: Award, label: 'Certifications' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export const EncrewLayout = () => {
  const { user, employee, signOut } = useAuth();
  const location = useLocation();
  const displayName = employee?.name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full" style={{ background: 'hsl(var(--surface-1))' }}>
        <Sidebar className="border-r" style={{ background: 'var(--gradient-sidebar)', borderColor: 'hsl(var(--sidebar-border))' }}>
          <SidebarHeader className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold" style={{ background: 'var(--gradient-primary)', color: 'hsl(var(--primary-foreground))' }}>
                <Users className="w-4.5 h-4.5" />
              </div>
              <div>
                <h1 className="font-bold text-sidebar-accent-foreground text-sm tracking-tight">HR Hub</h1>
                <p className="text-[10px] text-sidebar-foreground">by Enfactum</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-sidebar-foreground">Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map(item => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        asChild
                        isActive={item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)}
                      >
                        <NavLink to={item.to}>
                          <item.icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-xs bg-sidebar-accent text-sidebar-accent-foreground">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-sidebar-accent-foreground truncate">{displayName}</p>
                <p className="text-[10px] text-sidebar-foreground truncate">{employee?.designation || employee?.role || ''}</p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <header className="h-14 flex items-center justify-between px-4 border-b" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--surface-2))' }}>
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <h2 className="text-sm font-semibold text-foreground">
                {navItems.find(n => n.to === '/' ? location.pathname === '/' : location.pathname.startsWith(n.to))?.label || 'HR Hub'}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground hidden sm:block">{displayName}</span>
              <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hover:text-foreground">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4 md:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.18 } }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
