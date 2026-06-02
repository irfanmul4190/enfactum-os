import { useMemo } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  FolderOpen,
  Users,
  Building2,
  DollarSign,
  FileCheck,
  Settings,
  Palette,
  BookOpen,
  Send,
  HelpCircle,
  TrendingUp,
  LucideIcon
} from "lucide-react";
import { useCurrentUserPermissions } from './useCurrentUserPermissions';
import { useAuth } from '@/contexts/AuthContext';

export interface NavItem {
  id: string;
  title: string;
  url: string;
  icon: LucideIcon;
}

export interface SidebarNavConfig {
  headerTitle: string;
  headerSubtitle: string;
  mainNavItems: NavItem[];
  managementItems: NavItem[];
  showCreateActivity: boolean;
  isPartnerView: boolean;
}

// Team types that determine navigation structure
type TeamType = 'Director' | 'Project' | 'Operations' | 'Design' | 'Digital' | 'Partner' | 'Unknown';

// Map team names from database to team types
function getTeamType(team: string | null | undefined, role: string | null | undefined): TeamType {
  if (!team && !role) return 'Unknown';
  
  // Check role first for Partner
  if (role === 'Partner') return 'Partner';
  
  const teamLower = (team || '').toLowerCase();
  
  if (teamLower.includes('director')) return 'Director';
  if (teamLower.includes('project')) return 'Project';
  if (teamLower.includes('operations') || teamLower.includes('ops')) return 'Operations';
  if (teamLower.includes('design')) return 'Design';
  if (teamLower.includes('digital')) return 'Digital';
  
  // Fallback based on role
  if (role === 'Agency Director' || role === 'Super Admin') return 'Director';
  if (role === 'Ops') return 'Operations';
  if (role === 'Project Lead' || role === 'PMM' || role === 'PBM') return 'Project';
  
  return 'Unknown';
}

// All possible nav items
const allMainNavItems: NavItem[] = [
  { id: 'dashboard', title: "Dashboard", url: "/", icon: LayoutDashboard },
  { id: 'projects', title: "Projects", url: "/projects", icon: FolderOpen },
  { id: 'activities', title: "Activities", url: "/activities", icon: FolderKanban },
  { id: 'clients', title: "Clients", url: "/clients", icon: Building2 },
  { id: 'vendors', title: "Vendors", url: "/vendors", icon: Users },
  { id: 'poe', title: "POE Submissions", url: "/poe", icon: FileCheck },
  { id: 'creatives', title: "Creative Queue", url: "/creatives", icon: Palette },
  { id: 'resources', title: "Resource Hub", url: "/resources", icon: BookOpen },
  { id: 'mdf-pipeline', title: "MDF Pipeline", url: "/mdf-pipeline", icon: TrendingUp },
];

const allManagementItems: NavItem[] = [
  { id: 'financials', title: "Financials", url: "/financials", icon: DollarSign },
  { id: 'team', title: "Team", url: "/team", icon: Users },
  { id: 'settings', title: "Settings", url: "/settings", icon: Settings },
];

// Partner-specific nav items
const partnerNavItems: NavItem[] = [
  { id: 'activities', title: "My Activities", url: "/activities", icon: FolderKanban },
  { id: 'poe', title: "Submit POE", url: "/poe", icon: Send },
  { id: 'resources', title: "Support", url: "/resources", icon: HelpCircle },
];

// Navigation configurations by team type
function getNavConfig(teamType: TeamType, permissions: ReturnType<typeof useCurrentUserPermissions>): SidebarNavConfig {
  switch (teamType) {
    case 'Director':
      // Full access to everything including Financials, User Matrix (Settings), Regional Global View
      return {
        headerTitle: 'Enfactum',
        headerSubtitle: 'Command Center',
        mainNavItems: allMainNavItems,
        managementItems: allManagementItems,
        showCreateActivity: true,
        isPartnerView: false,
      };

    case 'Operations':
      // Dashboard, Activity Pipeline, POE Manager, Resource Hub + Financials access
      return {
        headerTitle: 'Enfactum',
        headerSubtitle: 'Command Center',
        mainNavItems: allMainNavItems.filter(item => 
          ['dashboard', 'projects', 'activities', 'vendors', 'poe', 'resources', 'creatives', 'mdf-pipeline'].includes(item.id)
        ),
        managementItems: allManagementItems.filter(item => 
          ['financials', 'team'].includes(item.id)
        ),
        showCreateActivity: true,
        isPartnerView: false,
      };

    case 'Project':
      // Dashboard, Activity Pipeline, POE Manager, Resource Hub
      return {
        headerTitle: 'Enfactum',
        headerSubtitle: 'Command Center',
        mainNavItems: allMainNavItems.filter(item => 
          ['dashboard', 'projects', 'activities', 'clients', 'vendors', 'poe', 'resources', 'creatives', 'mdf-pipeline'].includes(item.id)
        ),
        managementItems: [],
        showCreateActivity: true,
        isPartnerView: false,
      };

    case 'Design':
    case 'Digital':
      // Hide Financials and Create Activity, rename header to 'Asset Workspace'
      return {
        headerTitle: 'Enfactum',
        headerSubtitle: 'Asset Workspace',
        mainNavItems: allMainNavItems.filter(item => 
          ['dashboard', 'activities', 'creatives', 'resources'].includes(item.id)
        ),
        managementItems: [],
        showCreateActivity: false,
        isPartnerView: false,
      };

    case 'Partner':
      // Simplified menu: My Activities, Submit POE, Support
      return {
        headerTitle: 'Partner',
        headerSubtitle: 'Portal',
        mainNavItems: partnerNavItems,
        managementItems: [],
        showCreateActivity: false,
        isPartnerView: true,
      };

    default:
      // Default to limited view
      return {
        headerTitle: 'Enfactum',
        headerSubtitle: 'Command Center',
        mainNavItems: allMainNavItems.filter(item => 
          ['dashboard', 'activities', 'resources'].includes(item.id)
        ),
        managementItems: [],
        showCreateActivity: false,
        isPartnerView: false,
      };
  }
}

// Route access mapping - which routes require which permissions
export const routePermissions: Record<string, { 
  allowedTeams: TeamType[], 
  permissionKey?: keyof ReturnType<typeof useCurrentUserPermissions>
}> = {
  '/': { allowedTeams: ['Director', 'Project', 'Operations', 'Design', 'Digital', 'Partner', 'Unknown'] },
  '/projects': { allowedTeams: ['Director', 'Project', 'Operations'] },
  '/activities': { allowedTeams: ['Director', 'Project', 'Operations', 'Design', 'Digital', 'Partner'] },
  '/partners': { allowedTeams: ['Director', 'Project'] },
  '/clients': { allowedTeams: ['Director', 'Operations'] },
  '/vendors': { allowedTeams: ['Director', 'Project', 'Operations'] },
  '/poe': { allowedTeams: ['Director', 'Project', 'Operations', 'Partner'] },
  '/creatives': { allowedTeams: ['Director', 'Project', 'Operations', 'Design', 'Digital'] },
  '/resources': { allowedTeams: ['Director', 'Project', 'Operations', 'Design', 'Digital', 'Partner'] },
  '/financials': { allowedTeams: ['Director', 'Operations'], permissionKey: 'can_view_margin' },
  '/mdf-pipeline': { allowedTeams: ['Director', 'Project', 'Operations'] },
  '/team': { allowedTeams: ['Director', 'Operations'] },
  '/settings': { allowedTeams: ['Director'] },
};

export function useSidebarNavigation() {
  const permissions = useCurrentUserPermissions();
  const { canAdmin, canWrite, canRead } = useAuth();

  const navConfig = useMemo(() => {
    // Primary: drive team type from the team_members row.
    let teamType = getTeamType(undefined, permissions.role);

    // Fallback: if no team_members row exists yet (team_type='Unknown'),
    // derive a sensible default from the auth-gate access level so the
    // user doesn't get stuck with the 3-item 'Unknown' sidebar. Anyone
    // who passed the gate has at least read access on the access matrix.
    if (teamType === 'Unknown') {
      if (canAdmin) teamType = 'Director';
      else if (canWrite) teamType = 'Project';
      else if (canRead) teamType = 'Project';
    }

    return getNavConfig(teamType, permissions);
  }, [permissions.role, canAdmin, canWrite, canRead, permissions]);

  return {
    ...navConfig,
    permissions,
    isLoading: permissions.isLoading,
  };
}

export function useRouteAccess(pathname: string): {
  hasAccess: boolean;
  isLoading: boolean;
  redirectTo: string;
} {
  const permissions = useCurrentUserPermissions();
  const { canAdmin, canWrite, canRead } = useAuth();

  const accessCheck = useMemo(() => {
    if (permissions.isLoading) {
      return { hasAccess: true, redirectTo: '/' };
    }

    let teamType = getTeamType(undefined, permissions.role);

    // Same fallback as useSidebarNavigation so route gates and sidebar
    // visibility stay in sync.
    if (teamType === 'Unknown') {
      if (canAdmin) teamType = 'Director';
      else if (canWrite) teamType = 'Project';
      else if (canRead) teamType = 'Project';
    }

    // Normalize pathname (remove trailing slash, handle dynamic routes)
    const basePath = '/' + pathname.split('/').filter(Boolean)[0] || '/';
    const normalizedPath = basePath === '/' ? '/' : basePath;

    const routeConfig = routePermissions[normalizedPath];

    // If no config found, allow access (unknown routes handled by NotFound)
    if (!routeConfig) {
      return { hasAccess: true, redirectTo: '/' };
    }

    // Check team access
    if (!routeConfig.allowedTeams.includes(teamType)) {
      return { hasAccess: false, redirectTo: '/' };
    }

    // Check specific permission if required
    if (routeConfig.permissionKey) {
      const hasPermission = permissions[routeConfig.permissionKey];
      if (!hasPermission) {
        return { hasAccess: false, redirectTo: '/' };
      }
    }

    return { hasAccess: true, redirectTo: '/' };
  }, [pathname, permissions, canAdmin, canWrite, canRead]);

  return {
    ...accessCheck,
    isLoading: permissions.isLoading,
  };
}
