import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TeamMember {
  id: string;
  email: string;
  full_name: string;
  team: string;
  role: string;
  user_id: string | null;
  is_active: boolean;
  created_at: string;
}

export function useTeamMembers() {
  return useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('is_active', true)
        .order('team', { ascending: true })
        .order('full_name', { ascending: true });

      if (error) throw error;
      return data as TeamMember[];
    },
  });
}

export function groupTeamMembersByTeam(members: TeamMember[]) {
  const grouped: Record<string, TeamMember[]> = {};
  
  members.forEach(member => {
    const team = member.team || 'Other';
    if (!grouped[team]) {
      grouped[team] = [];
    }
    grouped[team].push(member);
  });

  // Sort teams in a logical order
  const teamOrder = ['Director Team', 'Project Team', 'Project Team/AI Team', 'Operations Team', 'Design Team', 'Digital Team', 'Other'];
  const sortedGrouped: Record<string, TeamMember[]> = {};
  
  teamOrder.forEach(team => {
    if (grouped[team]) {
      sortedGrouped[team] = grouped[team];
    }
  });

  // Add any remaining teams not in the order
  Object.keys(grouped).forEach(team => {
    if (!sortedGrouped[team]) {
      sortedGrouped[team] = grouped[team];
    }
  });

  return sortedGrouped;
}
