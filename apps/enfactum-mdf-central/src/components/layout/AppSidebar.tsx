import { 
  ChevronRight,
  LogOut,
  Shield,
  Plus,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useSidebarNavigation } from "@/hooks/useSidebarNavigation";
import { Button } from "@/components/ui/button";
import { CreateActivityModal } from "@/components/activities/CreateActivityModal";

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const collapsed = state === "collapsed";
  
  const { 
    headerTitle, 
    headerSubtitle, 
    mainNavItems, 
    managementItems, 
    showCreateActivity,
    isPartnerView,
    isLoading 
  } = useSidebarNavigation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  if (isLoading) {
    return (
      <Sidebar 
        className={cn(
          "border-r border-sidebar-border transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
        collapsible="icon"
      >
        <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm animate-pulse">
              E
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-2 py-4">
          <div className="space-y-2 px-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-sidebar-accent/50 rounded-lg animate-pulse" />
            ))}
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar 
      className={cn(
        "border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg font-bold text-sm",
            isPartnerView 
              ? "bg-secondary text-secondary-foreground" 
              : "bg-primary text-primary-foreground"
          )}>
            {isPartnerView ? 'P' : 'E'}
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-accent-foreground">
                {headerTitle}
              </span>
              <span className="text-xs text-sidebar-foreground">
                {headerSubtitle}
              </span>
            </div>
          )}
        </div>
        
        {/* Create Activity Button */}
        {showCreateActivity && !collapsed && (
          <div className="mt-4">
            <CreateActivityModal 
              trigger={
                <Button size="sm" className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Create Activity
                </Button>
              }
            />
          </div>
        )}
        {showCreateActivity && collapsed && (
          <div className="mt-4 flex justify-center">
            <CreateActivityModal 
              trigger={
                <Button size="icon" className="h-9 w-9">
                  <Plus className="h-4 w-4" />
                </Button>
              }
            />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/60 px-3 mb-2">
              {isPartnerView ? 'Portal' : 'Main'}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink 
                      to={item.url} 
                      end={item.url === '/'} 
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-colors",
                        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        isActive(item.url) && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      )}
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                      {!collapsed && isActive(item.url) && (
                        <ChevronRight className="ml-auto h-4 w-4" />
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {managementItems.length > 0 && (
          <SidebarGroup className="mt-6">
            {!collapsed && (
              <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/60 px-3 mb-2">
                Management
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {managementItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                    >
                      <NavLink 
                        to={item.url} 
                        end 
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-colors",
                          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          isActive(item.url) && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        )}
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className={cn(
          "flex items-center gap-3",
          collapsed && "justify-center"
        )}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground text-sm font-medium">
            {user?.email?.charAt(0).toUpperCase() || <Shield className="h-4 w-4" />}
          </div>
          {!collapsed && (
            <div className="flex flex-1 flex-col text-sm min-w-0">
              <span className="font-medium text-sidebar-accent-foreground truncate">
                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
              </span>
              <span className="text-xs text-sidebar-foreground truncate">{user?.email}</span>
            </div>
          )}
          {!collapsed && (
            <button 
              onClick={handleSignOut}
              className="text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}